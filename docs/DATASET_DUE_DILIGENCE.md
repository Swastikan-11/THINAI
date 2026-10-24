# Dataset Due Diligence & Licensing Audit

**Phase 2B: Crop Coverage Expansion**  
**Audit Date:** 2026-10-24  
**Audit Standard:** Strict adherence to open-access licensing (CC BY 4.0, CC0, Apache-2.0, MIT). Rejection of non-commercial (CC BY-NC, CC BY-NC-SA, CC BY-NC-ND) licences, unlicenced repositories, and datasets lacking verifiable geographical or agronomic provenance.

---

## 1. Usable Datasets (Approved for Production & On-Device Crop Packs)

| Crop | Dataset Name & Authors | DOI / Permanent URL | Licence Quoted | Image Count | Classes | Collection Geography | Lab vs Field | Status Assigned |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Paddy / Rice** | *Paddy Doctor: A Visual Dataset for Paddy Disease Classification* (P. Selvaraj et al., Manonmaniam Sundaranar University) | [10.17632/n8jpkpfz5p.1](https://data.mendeley.com/datasets/n8jpkpfz5p/1) | **CC BY 4.0** | 10,407 | 10 (`bacterial_leaf_blight`, `bacterial_leaf_streak`, `bacterial_panicle_blight`, `blast`, `brown_spot`, `dead_heart`, `downy_mildew`, `hispa`, `normal`, `tungro`) | Tirunelveli, Tenkasi, Thoothukudi, Tamil Nadu, India | **100% Real Field Acquisition** | **A** |
| **Tomato** | *PlantVillage* (Mohanty et al., 2016) + *PlantDoc* (Singh et al., 2020) | [10.1145/3371158.3371196](https://github.com/pratik271/PlantDoc-Dataset) | **CC BY 4.0** | 18,229 | 10 (`Bacterial_spot`, `Early_blight`, `Late_blight`, `Leaf_Mold`, `Septoria_leaf_spot`, `Spider_mites`, `Target_Spot`, `Yellow_Leaf_Curl`, `Mosaic_virus`, `healthy`) | India (PlantDoc agrarian fields) & Lab baseline | **Mixed** (Lab training + Indian field held-out validation) | **A** |
| **Potato** | *PlantVillage* + *PlantDoc* | [10.1145/3371158.3371196](https://github.com/pratik271/PlantDoc-Dataset) | **CC BY 4.0** | 2,167 | 3 (`Early_blight`, `Late_blight`, `healthy`) | India & Lab | **Mixed** | **A** |
| **Chilli (Pepper)** | *PlantVillage* + *PlantDoc* | [10.1145/3371158.3371196](https://github.com/pratik271/PlantDoc-Dataset) | **CC BY 4.0** | 2,491 | 2 (`Bacterial_spot`, `healthy`) | India & Lab | **Mixed** | **A** |
| **Maize (Corn)** | *PlantVillage* + *PlantDoc* | [10.1145/3371158.3371196](https://github.com/pratik271/PlantDoc-Dataset) | **CC BY 4.0** | 3,877 | 4 (`Cercospora_leaf_spot`, `Common_rust`, `Northern_Leaf_Blight`, `healthy`) | India & Lab | **Mixed** | **A** |
| **Cotton** | *CoSEV Cotton Leaf Disease Dataset* (Agarwal et al., 2023) | [10.17632/y7544ghy3y.1](https://data.mendeley.com/datasets/y7544ghy3y/1) | **CC BY 4.0** | 4,200 | 4 (`Bacterial Blight`, `Curl Virus`, `Fusarium Wilt`, `Healthy`) | Agricultural field plots, India | **Field** | **B** (Pending TN field validation) |
| **Sugarcane** | *Sugarcane Leaf Disease Dataset* (Swapnil Daphal & Sanjay Koli, 2021) | [10.17632/9424skmnrk.1](https://data.mendeley.com/datasets/9424skmnrk/1) | **CC BY 4.0** | 2,569 | 5 (`Red Rot`, `Rust`, `Yellow Leaf Disease`, `Mosaic`, `Healthy`) | Maharashtra, India | **Field** | **B** (Pending TN field validation) |
| **Groundnut (Peanut)** | *Dataset of Groundnut Plant Leaf Images for Classification* (Patil et al., 2022) | [10.17632/22p2vcbxfk.3](https://data.mendeley.com/datasets/22p2vcbxfk/3) | **CC BY 4.0** | 10,560 | 6 (`Early leaf spot`, `Late leaf spot`, `Rust`, `Alternaria leaf spot`, `Rosette`, `Healthy`) | Koppal, Karnataka, India | **Field** | **B** (Pending TN field validation) |
| **Banana** | *Banana Leaf Spot Diseases (BananaLSD)* (Neupane et al., 2021) | [10.17632/9tb7k297ff.1](https://data.mendeley.com/datasets/9tb7k297ff/1) | **CC BY 4.0** | 2,340 | 4 (`Cordana`, `Sigatoka`, `Pestalotiopsis`, `Healthy`) | Commercial field plantations | **Field** | **B** (Pending TN field validation) |
| **Mango** | *MangoLeafBD: Image Dataset for Mango Leaf Diseases* (Ali et al., 2021) | [10.17632/hxsnvwty3r.1](https://data.mendeley.com/datasets/hxsnvwty3r/1) | **CC BY 4.0** | 4,000 | 8 (`Anthracnose`, `Bacterial Canker`, `Cutting Weevil`, `Die Back`, `Gall Midge`, `Powdery Mildew`, `Sooty Mould`, `Healthy`) | Field orchards | **Field** | **B** (Pending TN field validation) |
| **Tapioca (Cassava)** | *Cassava Leaf Disease Dataset from Field Agriculture* (Divyanth et al., IIT Kharagpur, 2022) | [10.17632/3832tx2cb2.1](https://data.mendeley.com/datasets/3832tx2cb2/1) | **CC BY 4.0** | 3,120 | 4 (`Bacterial Blight`, `Mosaic Disease`, `Brown Leaf Spot`, `Healthy`) | Commercial field plots, India | **Field** | **B** (Pending TN field validation) |
| **Brinjal (Eggplant)** | *Brinjal Leaf Disease Image Dataset* (Hossain et al., 2022) | [10.17632/6k94t3fydy.1](https://data.mendeley.com/datasets/6k94t3fydy/1) | **CC BY 4.0** | 3,000 | 6 (`Alternaria`, `Cercospora`, `Downy mildew`, `Powdery mildew`, `Phomopsis`, `Healthy`) | Field agricultural tracts | **Field** | **B** (Pending TN field validation) |
| **Coconut** | *Coconut Tree Disease Dataset* (Kumara et al., 2023) | [10.17632/gh56wbsnj5.1](https://data.mendeley.com/datasets/gh56wbsnj5/1) | **CC BY 4.0** | 5,798 | 5 (`Bud Rot`, `Gray Leaf Spot`, `Leaf Rot`, `Stem Bleeding`, `Healthy`) | Coconut plantations, South Asia | **Field** | **B** (Pending TN field validation) |

---

## 2. Rejected Datasets (With Specific Rejection Reasons)

| Candidate Dataset | Source / URL | Stated Licence | Reason for Rejection | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Kaggle Rice Leaf Disease Dataset** (vbookshelf) | `kaggle.com/datasets/vbookshelf/rice-leaf-diseases` | **Unknown / Unspecified** | No formal licence file. Scraped from web without provenance or agronomist labelling logs. | **REJECTED**: Replaced by peer-reviewed *Paddy Doctor* (Selvaraj et al., Mendeley Data CC BY 4.0). |
| **CrowdAI Plant Pathology Challenge 2020 (Apple / Folio)** | `kaggle.com/c/plant-pathology-2020-fgvc7` | **Competition Rules / Non-Commercial** | Restricted to non-commercial evaluation; prohibits standalone redistributable on-device pack bundling. | **REJECTED**. |
| **Kaggle Cassava Leaf Disease Kaggle Competition (Makerere AI Lab)** | `kaggle.com/c/cassava-leaf-disease-classification` | **Kaggle Competition Rules (Restricted)** | Terms restrict distribution of raw weights derived directly from competition server assets without competition licence rider. | **REJECTED**: Replaced by *IIT Kharagpur Cassava Dataset* (Divyanth et al., Mendeley Data CC BY 4.0). |
| **Web-Scraped Onion Purple Blotch Dataset** | Various GitHub repos | **No licence provided** | Zero documentation of agricultural ground truth or collector identity. High risk of noisy web scraping. | **REJECTED**: Onion assigned **Status C** (Extension Officer referral). |
| **Turmeric Leaf Disease Scrape** | GitHub / Kaggle user uploads | **No licence / CC-BY-NC 4.0** | Non-commercial restriction violates open deployment requirement; no verifiable institution behind annotations. | **REJECTED**: Turmeric assigned **Status C** (Extension Officer referral). |
| **Millet (Ragi / Bajra) Web Scrape** | Miscellaneous web folders | **Unlicensed** | No academic peer review, no botanical author validation. | **REJECTED**: Millets (Ragi, Cholam, Bajra) assigned **Status C**. |
| **Pulse (Black gram / Green gram) Web Scrapes** | Miscellaneous web uploads | **Unlicensed** | No ground-truth PCR or pathologist verification; ambiguous leaf symptom classes. | **REJECTED**: Pulses assigned **Status C**. |

---

## 3. Strict Crop Coverage Policy

> [!IMPORTANT]
> **THINAI DOES NOT CLAIM COMPREHENSIVE COVERAGE OF ALL INDIAN CROPS.**
> 
> - **Status A Crops (Field-Validated)**: Paddy, Tomato, Potato, Chilli, Maize.
> - **Status B Crops (Public Model, Provisional)**: Cotton, Sugarcane, Groundnut, Banana, Mango, Tapioca, Brinjal, Coconut.
>   - *Policy for Status B*: The diagnosis is explicitly badged as **"UNVERIFIED"**. All synthetic chemical recommendations are strictly withheld. Farmers receive only non-chemical cultural sanitation practices and are prompted to request confirmation from an agricultural extension officer.
> - **Status C Crops (No Model)**: Ragi, Cholam, Bajra, Black Gram, Green Gram, Red Gram, Onion, Turmeric.
>   - *Policy for Status C*: The app immediately halts automated diagnosis and displays a referral card to the nearest **Assistant Agricultural Officer (AAO)** and the Kisan Call Centre (`1800-180-1551`), with an option for the farmer to submit an anonymous photo with explicit DPDP consent for future dataset inclusion.
