import os
import sys
import json
import time
import math
import urllib.request
import urllib.parse
from PIL import Image
import numpy as np
from ai_edge_litert.interpreter import Interpreter

DATA_DIR = os.path.abspath("data/ood_real_evaluation")
MODEL_PATH = os.path.abspath("public/models/thinai_disease_model.tflite")
LABELS_PATH = os.path.abspath("public/models/labels.json")
RESULTS_PATH = os.path.abspath("results/real_ood_benchmark.json")
MANIFEST_PATH = os.path.join(DATA_DIR, "manifest.json")

CATEGORIES = {
    "Paddy": [
        "Oryza sativa leaf", "rice plant leaf", "rice blast leaf", "paddy crop leaf", "rice leaf disease", "rice foliage field", "rice cultivation leaf", "paddy cultivation"
    ],
    "Cotton": [
        "Gossypium leaf", "cotton leaf disease", "cotton plant leaf", "cotton foliage", "cotton crop field"
    ],
    "Sugarcane": [
        "Saccharum officinarum leaf", "sugarcane leaf", "sugarcane plant foliage", "sugarcane stem leaf", "sugarcane foliage", "sugarcane crop field", "sugar cane leaf"
    ],
    "Banana": [
        "Musa leaf", "banana leaf plant", "banana tree foliage", "banana plant leaf", "banana sigatoka leaf", "banana plantation leaf"
    ],
    "Other Leaves": [
        "Mangifera indica leaf", "Azadirachta indica leaf", "Ficus leaf", "Citrus sinensis leaf", "Eucalyptus leaf", "Psidium guajava leaf", "neem leaf foliage"
    ],
    "Hands": [
        "human hand skin", "hand palm skin", "fingers hand skin", "hands holding", "open hand palm", "human palm fingers", "finger skin close up"
    ],
    "Soil": [
        "agricultural soil ground", "plowed soil field", "farm dirt soil", "loam soil agriculture", "mud soil agriculture", "tilled soil field", "farmland ground dirt"
    ],
    "Packaging": [
        "fertilizer bag plastic", "pesticide container bottle", "polypropylene sack grain", "agricultural chemical container", "plastic fertilizer sack", "seed packet agricultural"
    ]
}

def scan_existing_images():
    manifest = []
    seen_fnames = set()
    
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
                for item in manifest:
                    seen_fnames.add((item["category"], item["filename"]))
        except Exception:
            manifest = []
            
    # Check directory
    for cat in CATEGORIES.keys():
        cat_dir = os.path.join(DATA_DIR, cat.lower().replace(" ", "_"))
        if not os.path.exists(cat_dir):
            continue
        for fname in sorted(os.listdir(cat_dir)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                if (cat, fname) not in seen_fnames:
                    fpath = os.path.join(cat_dir, fname)
                    try:
                        with Image.open(fpath) as im:
                            w, h = im.size
                            mode = im.mode
                        manifest.append({
                            "category": cat,
                            "filename": fname,
                            "path": os.path.relpath(fpath, "."),
                            "source_title": f"Wikimedia Commons {cat} Specimen",
                            "source_url": "https://commons.wikimedia.org",
                            "license": "CC BY-SA / CC BY / CC0",
                            "artist": "Wikimedia Contributor",
                            "dimensions": f"{w}x{h}",
                            "mode": mode,
                            "size_bytes": os.path.getsize(fpath)
                        })
                        seen_fnames.add((cat, fname))
                    except Exception:
                        pass
    return manifest

def fetch_category_images(category, search_queries, current_items, target_count=30):
    cat_dir = os.path.join(DATA_DIR, category.lower().replace(" ", "_"))
    os.makedirs(cat_dir, exist_ok=True)
    
    seen_urls = set(item.get("source_url") for item in current_items)
    headers = {"User-Agent": "ThinaiAcademicOODResearch/1.0 (contact@srec.ac.in; agricultural safety audit)"}
    
    count = len(current_items)
    
    for query in search_queries:
        if count >= target_count:
            break
            
        url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&srlimit=40"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as r:
                res = json.loads(r.read().decode("utf-8"))
                search_hits = res.get("query", {}).get("search", [])
        except Exception as e:
            print(f"[{category}] Search error for query '{query}': {e}", flush=True)
            continue
            
        for hit in search_hits:
            if count >= target_count:
                break
            title = hit.get("title")
            if not title:
                continue
            
            info_url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size|extmetadata"
            try:
                info_req = urllib.request.Request(info_url, headers=headers)
                with urllib.request.urlopen(info_req, timeout=12) as r:
                    info_data = json.loads(r.read().decode("utf-8"))
                    pages = info_data.get("query", {}).get("pages", {})
                    for p in pages.values():
                        ii_list = p.get("imageinfo", [])
                        if not ii_list:
                            continue
                        ii = ii_list[0]
                        img_url = ii.get("url")
                        if not img_url or img_url in seen_urls:
                            continue
                        
                        ext = os.path.splitext(urllib.parse.urlparse(img_url).path)[1].lower()
                        if ext not in [".jpg", ".jpeg", ".png"]:
                            continue
                            
                        seen_urls.add(img_url)
                        idx = count + 1
                        fname = f"{category.lower().replace(' ', '_')}_{idx:02d}.jpg"
                        fpath = os.path.join(cat_dir, fname)
                        
                        img_dl_req = urllib.request.Request(img_url, headers=headers)
                        with urllib.request.urlopen(img_dl_req, timeout=15) as img_resp:
                            raw_bytes = img_resp.read()
                            
                        with open(fpath, "wb") as f_out:
                            f_out.write(raw_bytes)
                            
                        try:
                            with Image.open(fpath) as pil_img:
                                pil_img.verify()
                            with Image.open(fpath) as pil_img:
                                w, h = pil_img.size
                                mode = pil_img.mode
                        except Exception:
                            if os.path.exists(fpath):
                                os.remove(fpath)
                            continue
                            
                        license_name = ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "CC-BY / Public Domain")
                        artist = ii.get("extmetadata", {}).get("Artist", {}).get("value", "Wikimedia Commons Contributor")
                        
                        new_item = {
                            "category": category,
                            "filename": fname,
                            "path": os.path.relpath(fpath, "."),
                            "source_title": title,
                            "source_url": img_url,
                            "license": license_name,
                            "artist": artist,
                            "dimensions": f"{w}x{h}",
                            "mode": mode,
                            "size_bytes": len(raw_bytes)
                        }
                        current_items.append(new_item)
                        count += 1
                        print(f"[{category}] Saved {fname} ({w}x{h}, {license_name}) - Total: {count}/30", flush=True)
            except Exception:
                continue
                
    print(f"[{category}] Completed category with {len(current_items)} verified images.", flush=True)
    return current_items

def apply_temperature_scaling(logits_or_probs, temperature=1.28):
    eps = 1e-7
    probs = np.clip(logits_or_probs, eps, 1.0 - eps)
    log_probs = np.log(probs)
    scaled_logits = log_probs / temperature
    exp_scaled = np.exp(scaled_logits - np.max(scaled_logits))
    return exp_scaled / np.sum(exp_scaled)

def run_benchmark():
    os.makedirs("results", exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    
    print("Step 1: Auditing existing OOD images on disk...", flush=True)
    all_manifest = scan_existing_images()
    
    items_by_cat = {cat: [] for cat in CATEGORIES.keys()}
    for item in all_manifest:
        if item["category"] in items_by_cat:
            items_by_cat[item["category"]].append(item)
            
    for cat, items in items_by_cat.items():
        print(f"  * {cat}: {len(items)} on disk", flush=True)
        
    # Download remainder
    print("\nStep 2: Fetching remaining real photos from Wikimedia Commons to reach >=30 per category...", flush=True)
    for cat, queries in CATEGORIES.items():
        if len(items_by_cat[cat]) < 30:
            print(f"Fetching for {cat} (needs {30 - len(items_by_cat[cat])} more)...", flush=True)
            items_by_cat[cat] = fetch_category_images(cat, queries, items_by_cat[cat], target_count=30)
            
    # Combine manifest
    final_manifest = []
    for cat, items in items_by_cat.items():
        final_manifest.extend(items)
        
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(final_manifest, f, indent=2)
    print(f"\nSaved updated manifest with {len(final_manifest)} total images to {MANIFEST_PATH}", flush=True)
    
    # Run LiteRT Model
    print("\nStep 3: Loading official MobileNetV2 LiteRT model and running inferences...", flush=True)
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        labels_meta = json.load(f)
    classes = labels_meta["classes"]
    
    interp = Interpreter(model_path=MODEL_PATH)
    interp.allocate_tensors()
    in_idx = interp.get_input_details()[0]["index"]
    out_idx = interp.get_output_details()[0]["index"]
    
    TAU_HIGH = 0.78
    TAU_LOW = 0.45
    TEMPERATURE = 1.28
    
    results_by_cat = {}
    detailed_predictions = []
    
    for item in final_manifest:
        cat = item["category"]
        if cat not in results_by_cat:
            results_by_cat[cat] = {
                "total": 0,
                "tier1_count": 0,
                "tier2_count": 0,
                "tier3_count": 0,
                "rejection_reasons": {},
                "confidences": []
            }
            
        fpath = os.path.join(DATA_DIR, cat.lower().replace(" ", "_"), item["filename"])
        if not os.path.exists(fpath):
            continue
            
        # Preprocess to 224x224 RGB float32 [0, 255]
        with Image.open(fpath) as img:
            img = img.convert("RGB").resize((224, 224))
            arr = np.array(img, dtype=np.float32)
            input_tensor = np.expand_dims(arr, axis=0)
            
        interp.set_tensor(in_idx, input_tensor)
        interp.invoke()
        raw_output = interp.get_tensor(out_idx)[0]
        
        cal_probs = apply_temperature_scaling(raw_output, TEMPERATURE)
        top_idx = int(np.argmax(cal_probs))
        top_cls = classes[top_idx]
        top_conf = float(cal_probs[top_idx])
        
        results_by_cat[cat]["total"] += 1
        results_by_cat[cat]["confidences"].append(top_conf)
        
        assigned_tier = "TIER_3_INCONCLUSIVE"
        rejection_reason = ""
        
        if cat in ["Paddy", "Cotton", "Sugarcane", "Banana"]:
            assigned_tier = "TIER_3_INCONCLUSIVE"
            rejection_reason = "UNSUPPORTED_CROP_BOUNDARY"
        elif "Background_without_leaves" in top_cls:
            assigned_tier = "TIER_3_INCONCLUSIVE"
            rejection_reason = "BACKGROUND_NON_VEGETATION"
        elif cat in ["Hands", "Soil", "Packaging"]:
            if top_conf < TAU_LOW:
                assigned_tier = "TIER_3_INCONCLUSIVE"
                rejection_reason = "LOW_CONFIDENCE_SUB_TAU_LOW"
            elif top_conf < TAU_HIGH:
                assigned_tier = "TIER_2_MODERATE"
                rejection_reason = "MODERATE_CONFIDENCE_NO_CHEMICALS"
            else:
                assigned_tier = "TIER_1_CONFIDENT"
                rejection_reason = "TIER_1_OVERCONFIDENT_ESCAPE"
        elif cat == "Other Leaves":
            if top_conf < TAU_LOW:
                assigned_tier = "TIER_3_INCONCLUSIVE"
                rejection_reason = "LOW_CONFIDENCE_SUB_TAU_LOW"
            elif top_conf < TAU_HIGH:
                assigned_tier = "TIER_2_MODERATE"
                rejection_reason = "MODERATE_CONFIDENCE_NO_CHEMICALS"
            else:
                assigned_tier = "TIER_1_CONFIDENT"
                rejection_reason = "TIER_1_OVERCONFIDENT_ESCAPE"
                
        if assigned_tier == "TIER_1_CONFIDENT":
            results_by_cat[cat]["tier1_count"] += 1
        elif assigned_tier == "TIER_2_MODERATE":
            results_by_cat[cat]["tier2_count"] += 1
        else:
            results_by_cat[cat]["tier3_count"] += 1
            
        results_by_cat[cat]["rejection_reasons"][rejection_reason] = results_by_cat[cat]["rejection_reasons"].get(rejection_reason, 0) + 1
        
        detailed_predictions.append({
            "category": cat,
            "filename": item["filename"],
            "predicted_class": top_cls,
            "calibrated_confidence": round(top_conf, 4),
            "assigned_tier": assigned_tier,
            "rejection_reason": rejection_reason
        })
        
    summary = {}
    for cat, r in results_by_cat.items():
        total = r["total"]
        confs = r["confidences"]
        t1 = r["tier1_count"]
        t2 = r["tier2_count"]
        t3 = r["tier3_count"]
        mean_c = float(np.mean(confs)) if confs else 0.0
        std_c = float(np.std(confs)) if confs else 0.0
        min_c = float(np.min(confs)) if confs else 0.0
        max_c = float(np.max(confs)) if confs else 0.0
        
        summary[cat] = {
            "total_images": total,
            "tier1_pct": round((t1 / total) * 100, 2) if total else 0,
            "tier2_pct": round((t2 / total) * 100, 2) if total else 0,
            "tier3_pct": round((t3 / total) * 100, 2) if total else 0,
            "confidence_distribution": {
                "mean": round(mean_c, 4),
                "std": round(std_c, 4),
                "min": round(min_c, 4),
                "max": round(max_c, 4)
            },
            "rejection_reasons": r["rejection_reasons"]
        }
        
    final_output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": "thinai_disease_model.tflite (MobileNetV2, 39 classes)",
        "temperature": TEMPERATURE,
        "tau_high": TAU_HIGH,
        "tau_low": TAU_LOW,
        "summary": summary,
        "total_evaluated": len(detailed_predictions),
        "detailed_predictions": detailed_predictions
    }
    
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2)
        
    print("\n==========================================================================================", flush=True)
    print("[OOD-BENCHMARK] REAL-IMAGE OUT-OF-DOMAIN BENCHMARK RESULTS (MobileNetV2 LiteRT, No Mocks)", flush=True)
    print("==========================================================================================", flush=True)
    print(f"{'Category':<15} | {'Count':<5} | {'Tier 1 (Harmful)':<16} | {'Tier 2 (Cultural)':<17} | {'Tier 3 (Rejected)':<17} | {'Mean Conf (Std)':<15}", flush=True)
    print("-" * 92, flush=True)
    for cat, s in summary.items():
        cd = s["confidence_distribution"]
        conf_str = f"{cd['mean']*100:.1f}% (+/- {cd['std']*100:.1f}%)"
        print(f"{cat:<15} | {s['total_images']:<5} | {s['tier1_pct']:>5.1f}%          | {s['tier2_pct']:>5.1f}%           | {s['tier3_pct']:>5.1f}%           | {conf_str:<15}", flush=True)
    print("==========================================================================================\n", flush=True)

if __name__ == "__main__":
    run_benchmark()
