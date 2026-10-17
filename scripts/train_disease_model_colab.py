"""
THINAI MobileNetV2 Crop Disease Model Training & TFLite Export Pipeline
Designed for Google Colab (Free T4 GPU runtime - Zero Cost)

Dataset Coverage:
1. Tomato (Early Blight, Late Blight, Leaf Mold, Bacterial Spot, Healthy)
2. Potato (Early Blight, Late Blight, Healthy)
3. Pepper Bell (Bacterial Spot, Healthy)
4. Maize / Corn (Common Rust, Gray Leaf Spot, Northern Leaf Blight, Healthy)

Instructions:
1. Open https://colab.research.google.com
2. Change runtime type to GPU (Runtime > Change runtime type > T4 GPU)
3. Run this script.
4. Download the generated 'thinai_model_export.zip' and extract it into THINAI/public/models/
"""

import os
import json
import zipfile
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2

print("TensorFlow Version:", tf.__version__)
print("GPU Available:", tf.config.list_physical_devices('GPU'))

# 1. PARAMETERS & REPRODUCIBILITY
SEED = 42
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 1e-4

tf.random.set_seed(SEED)
np.random.seed(SEED)

# 2. DATASET DOWNLOAD (PlantVillage Subset via TensorFlow Datasets / Official Mirrors)
print("\n[Step 1/6] Downloading PlantVillage Dataset...")
dataset_url = "https://storage.googleapis.com/plantvillage_subset/plantvillage_tn_priority.zip"
# Fallback mirror or direct tfds
data_dir = tf.keras.utils.get_file(
    'plantvillage_subset',
    origin='https://github.com/spMohanty/PlantVillage-Dataset/raw/master/raw/segmented.zip',
    extract=True,
    cache_subdir='datasets'
)
extracted_path = os.path.join(os.path.dirname(data_dir), 'segmented')

print("Dataset ready at:", extracted_path)

# 3. DATA LOADERS WITH HONEST TRAIN/VAL/TEST SPLITS
print("\n[Step 2/6] Preparing 80% Train, 10% Validation, 10% Test Splits...")

train_ds = tf.keras.utils.image_dataset_from_directory(
    extracted_path,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_test_ds = tf.keras.utils.image_dataset_from_directory(
    extracted_path,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
num_classes = len(class_names)
print(f"Total Detected Classes ({num_classes}):", class_names)

# Split val into 50% val and 50% test (10% test overall)
val_batches = tf.data.experimental.cardinality(val_test_ds)
test_ds = val_test_ds.take(val_batches // 2)
val_ds = val_test_ds.skip(val_batches // 2)

# Prefetch for performance
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
test_ds = test_ds.cache().prefetch(buffer_size=AUTOTUNE)

# 4. MODEL ARCHITECTURE (MobileNetV2 Transfer Learning)
print("\n[Step 3/6] Building MobileNetV2 with ImageNet Pre-trained Base...")

data_augmentation = keras.Sequential([
    layers.RandomFlip("horizontal_and_vertical"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.1),
], name="data_augmentation")

base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Freeze base during stage 1

inputs = keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
# MobileNetV2 expects [-1, 1] normalized pixel values
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation='relu')(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(num_classes, activation='softmax', name='prediction_scores')(x)

model = keras.Model(inputs, outputs, name="thinai_mobilenetv2_disease")

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 5. TRAINING & FINE-TUNING
print("\n[Step 4/6] Training Initial Head...")
history = model.fit(
    train_ds,
    epochs=10,
    validation_data=val_ds,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)
    ]
)

# Stage 2: Fine-tune top 30 layers of MobileNetV2
print("\nFine-tuning Top 30 Layers of MobileNetV2...")
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-5),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history_finetune = model.fit(
    train_ds,
    epochs=5,
    validation_data=val_ds
)

# 6. HONEST EVALUATION (Lab Test vs Field Augmented Test)
print("\n[Step 5/6] Evaluating Honest Accuracy Metrics...")
test_loss, test_acc = model.evaluate(test_ds)
print(f"-> Lab Clean Test Accuracy: {test_acc * 100:.2f}%")

# Augmented field simulation test
field_test_ds = test_ds.map(lambda x, y: (data_augmentation(x, training=True), y))
field_loss, field_acc = model.evaluate(field_test_ds)
print(f"-> Field Augmented Simulation Accuracy: {field_acc * 100:.2f}%")

# Save Keras Model
os.makedirs("output", exist_ok=True)
keras_path = "output/thinai_disease_model.keras"
model.save(keras_path)
print(f"Keras model saved to {keras_path}")

# 7. EXPORT TO TFLITE (Zero Cost Client Inference)
print("\n[Step 6/6] Converting to Quantized TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
# Dynamic range float16 quantization for small size and fast browser wasm execution
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
tflite_model = converter.convert()

tflite_path = "output/thinai_disease_model.tflite"
with open(tflite_path, "wb") as f:
    f.write(tflite_model)

tflite_size_mb = os.path.getsize(tflite_path) / (1024 * 1024)
print(f"TFLite model saved to {tflite_path} ({tflite_size_mb:.2f} MB)")

# Save class labels metadata
labels_metadata = {
    "model_name": "THINAI MobileNetV2 Agricultural Pathology Classifier",
    "architecture": "MobileNetV2",
    "framework": "LiteRT.js / TensorFlow Lite",
    "classes": class_names,
    "input_shape": [1, 224, 224, 3],
    "normalization": "MobileNetV2 [-1.0, 1.0]",
    "confidence_threshold": 0.65,
    "metrics": {
        "lab_accuracy": round(float(test_acc * 100), 2),
        "field_augmented_accuracy": round(float(field_acc * 100), 2)
    }
}

labels_path = "output/labels.json"
with open(labels_path, "w") as f:
    json.dump(labels_metadata, f, indent=2)

print(f"Metadata saved to {labels_path}")

# Zip everything for one-click download
zip_path = "thinai_model_export.zip"
with zipfile.ZipFile(zip_path, 'w') as zipf:
    zipf.write(tflite_path, arcname="thinai_disease_model.tflite")
    zipf.write(labels_path, arcname="labels.json")
    zipf.write(keras_path, arcname="thinai_disease_model.keras")

print(f"\nSUCCESS! Download '{zip_path}' and extract into THINAI/public/models/")
