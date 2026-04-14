"""
Seed data for the 18 reference peptides.
All data is informational only — not medical advice.
"""

PEPTIDES = [
    {
        "slug": "bpc-157",
        "name": "BPC-157",
        "aliases": ["Body Protection Compound 157", "PL 14736"],
        "description": (
            "BPC-157 is a synthetic pentadecapeptide derived from a protective protein found in gastric juice. "
            "It has been studied for its potential regenerative effects on tendons, ligaments, muscles, and the "
            "gastrointestinal tract. It appears to upregulate growth hormone receptors and promote angiogenesis."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "BPC-157 is not approved by the FDA or any regulatory body for human use. "
            "Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 4.0,
        "recommended_dose_mcg_min": 200.0,
        "recommended_dose_mcg_max": 500.0,
        "max_dose_mcg": 1000.0,
        "frequency_notes": "Typically administered once or twice daily. Common cycles are 4–8 weeks.",
        "storage_temp": "fridge",
        "routes": ["subq", "im", "intranasal"],
        "common_protocols": [
            {"name": "Systemic (twice daily)", "description": "200–500 mcg subQ or IM twice daily for 4–6 weeks, typically near the injury site or abdomen."},
            {"name": "Intranasal (low dose)", "description": "200 mcg intranasal once daily for brain/CNS support protocols."},
        ],
        "side_effects": ["nausea", "dizziness", "headache", "injection site redness", "fatigue"],
        "synergies": ["TB-500", "GHK-Cu"],
    },
    {
        "slug": "tb-500",
        "name": "TB-500",
        "aliases": ["Thymosin Beta-4", "Tβ4"],
        "description": (
            "TB-500 is a synthetic version of a portion of Thymosin Beta-4, a naturally occurring protein "
            "involved in cell migration, wound healing, and inflammation regulation. It promotes actin "
            "polymerization and has been studied for recovery from injury and cardiovascular support."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "TB-500 is not approved for human therapeutic use. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 24.0,
        "recommended_dose_mcg_min": 2000.0,
        "recommended_dose_mcg_max": 5000.0,
        "max_dose_mcg": 10000.0,
        "frequency_notes": "Loading phase: 2–2.5 mg twice weekly for 4–6 weeks. Maintenance: 2 mg every 2 weeks.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "Loading + Maintenance", "description": "2500 mcg subQ or IM twice weekly for 4–6 weeks (loading), then 2000 mcg biweekly for maintenance."},
            {"name": "Acute injury", "description": "5000 mcg IM twice weekly for 2 weeks immediately post-injury."},
        ],
        "side_effects": ["fatigue", "nausea", "head rush", "injection site discomfort", "lethargy"],
        "synergies": ["BPC-157", "GHK-Cu"],
    },
    {
        "slug": "semaglutide",
        "name": "Semaglutide",
        "aliases": ["Ozempic", "Wegovy", "Rybelsus"],
        "description": (
            "Semaglutide is a GLP-1 receptor agonist that mimics the glucagon-like peptide-1 hormone. "
            "It was originally developed for type 2 diabetes management and has been approved for chronic "
            "weight management. It slows gastric emptying, reduces appetite, and improves glycemic control."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Semaglutide is an FDA-approved prescription medication. It should only be used under the "
            "supervision of a qualified healthcare professional."
        ),
        "half_life_hours": 168.0,
        "recommended_dose_mcg_min": 250.0,
        "recommended_dose_mcg_max": 1000.0,
        "max_dose_mcg": 2400.0,
        "frequency_notes": "Administered once weekly. Titrate from 250 mcg/week, increasing every 4 weeks as tolerated.",
        "storage_temp": "fridge",
        "routes": ["subq"],
        "common_protocols": [
            {"name": "Standard titration", "description": "Start at 250 mcg/week for 4 weeks → 500 mcg/week → 1 mg/week → up to 2 mg/week based on tolerance."},
            {"name": "Microdosing", "description": "Some users start at 100–250 mcg/week to minimize GI side effects during adjustment."},
        ],
        "side_effects": ["nausea", "vomiting", "diarrhea", "constipation", "abdominal pain", "fatigue", "injection site reactions", "hypoglycemia"],
        "synergies": [],
    },
    {
        "slug": "tirzepatide",
        "name": "Tirzepatide",
        "aliases": ["Mounjaro", "Zepbound"],
        "description": (
            "Tirzepatide is a dual GIP (glucose-dependent insulinotropic polypeptide) and GLP-1 receptor agonist. "
            "It is FDA-approved for type 2 diabetes and obesity. Clinical trials show superior weight loss outcomes "
            "compared to GLP-1 monotherapy."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Tirzepatide is an FDA-approved prescription medication. Use only under supervision of a qualified "
            "healthcare professional."
        ),
        "half_life_hours": 120.0,
        "recommended_dose_mcg_min": 2500.0,
        "recommended_dose_mcg_max": 10000.0,
        "max_dose_mcg": 15000.0,
        "frequency_notes": "Once weekly subQ injection. Titrate: 2.5 mg/week for 4 weeks, then increase by 2.5 mg every 4 weeks as tolerated.",
        "storage_temp": "fridge",
        "routes": ["subq"],
        "common_protocols": [
            {"name": "Standard titration", "description": "2.5 mg/week × 4 weeks → 5 mg/week → 7.5 mg/week → 10 mg/week → up to 15 mg/week."},
        ],
        "side_effects": ["nausea", "diarrhea", "vomiting", "constipation", "abdominal pain", "decreased appetite", "injection site reactions"],
        "synergies": [],
    },
    {
        "slug": "cjc-1295",
        "name": "CJC-1295",
        "aliases": ["CJC-1295 DAC", "DAC:GRF", "Drug Affinity Complex: Growth Hormone Releasing Factor"],
        "description": (
            "CJC-1295 is a synthetic analogue of growth hormone-releasing hormone (GHRH). The DAC (Drug Affinity Complex) "
            "version features an extended half-life via albumin binding. It stimulates pulsatile GH release from the "
            "pituitary and is often combined with a GHRP or Ipamorelin for synergistic effect."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "CJC-1295 is not approved for human use. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 168.0,
        "recommended_dose_mcg_min": 1000.0,
        "recommended_dose_mcg_max": 2000.0,
        "max_dose_mcg": 2000.0,
        "frequency_notes": "Typically 1–2 mg once or twice weekly (DAC version). Non-DAC version: 100 mcg per injection, up to 3× daily.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "CJC-1295 DAC weekly", "description": "1000–2000 mcg subQ once weekly, often stacked with Ipamorelin 200 mcg 3× daily."},
            {"name": "CJC-1295 no-DAC with GHRP", "description": "100 mcg CJC-1295 (no DAC) + 100–200 mcg GHRP-2 or Ipamorelin, injected together 3× daily before meals or pre-sleep."},
        ],
        "side_effects": ["water retention", "numbness/tingling", "fatigue", "headache", "hypoglycemia", "injection site redness"],
        "synergies": ["Ipamorelin", "Sermorelin"],
    },
    {
        "slug": "ipamorelin",
        "name": "Ipamorelin",
        "aliases": ["NNC 26-0161"],
        "description": (
            "Ipamorelin is a selective growth hormone secretagogue and ghrelin mimetic. It stimulates GH release "
            "from the pituitary with high selectivity, producing minimal cortisol or prolactin elevation compared "
            "to other GHRPs. Frequently combined with CJC-1295 for amplified GH pulse."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Ipamorelin is not approved for human use. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 2.0,
        "recommended_dose_mcg_min": 100.0,
        "recommended_dose_mcg_max": 300.0,
        "max_dose_mcg": 500.0,
        "frequency_notes": "100–300 mcg per injection, 2–3× daily. Best administered fasted or 2+ hours post-meal. Pre-sleep dosing is common.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "Ipamorelin alone", "description": "200 mcg subQ 2–3× daily (morning, pre-workout, before sleep). 12-week cycles."},
            {"name": "CJC-1295 + Ipamorelin stack", "description": "CJC-1295 DAC 1000–2000 mcg/week + Ipamorelin 200 mcg 3× daily. Classic GH optimization stack."},
        ],
        "side_effects": ["headache", "flushing", "dizziness", "water retention", "mild hunger increase", "injection site discomfort"],
        "synergies": ["CJC-1295", "Sermorelin"],
    },
    {
        "slug": "sermorelin",
        "name": "Sermorelin",
        "aliases": ["GRF 1-29", "GHRH 1-29"],
        "description": (
            "Sermorelin is the first 29 amino acids of endogenous growth hormone-releasing hormone (GHRH). "
            "It stimulates the pituitary to produce and secrete GH in a physiological pulsatile manner. "
            "It has a shorter half-life than CJC-1295 and is cleared quickly, making it a more natural GH stimulus."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Sermorelin acetate was previously FDA-approved but is now available only through compounding pharmacies "
            "in the US. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 0.17,
        "recommended_dose_mcg_min": 200.0,
        "recommended_dose_mcg_max": 500.0,
        "max_dose_mcg": 1000.0,
        "frequency_notes": "200–500 mcg subQ before bedtime. Can be combined with a GHRP for enhanced effect.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "Bedtime protocol", "description": "300 mcg subQ 30 min before sleep to enhance natural GH surge. 3–6 month cycles."},
            {"name": "Sermorelin + Ipamorelin", "description": "300 mcg Sermorelin + 200 mcg Ipamorelin combined in one injection before sleep."},
        ],
        "side_effects": ["injection site pain/redness", "flushing", "headache", "nausea", "dizziness", "water retention"],
        "synergies": ["Ipamorelin", "CJC-1295"],
    },
    {
        "slug": "mt-2",
        "name": "Melanotan II",
        "aliases": ["MT-2", "MT-II", "Melanotan 2"],
        "description": (
            "Melanotan II is a synthetic analogue of alpha-melanocyte-stimulating hormone (α-MSH). "
            "It activates melanocortin receptors, promoting melanogenesis (skin tanning), and has been studied "
            "for effects on libido and appetite suppression. It is distinct from Bremelanotide (PT-141) but shares "
            "structural similarities."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Melanotan II is not approved by any regulatory body and is considered a research chemical. "
            "It carries significant cardiovascular and dermatological risks. Consult a qualified healthcare "
            "professional before use."
        ),
        "half_life_hours": 0.33,
        "recommended_dose_mcg_min": 250.0,
        "recommended_dose_mcg_max": 500.0,
        "max_dose_mcg": 1000.0,
        "frequency_notes": "Loading: 250–500 mcg daily subQ for 7–14 days. Maintenance: 500 mcg 1–2× weekly.",
        "storage_temp": "fridge",
        "routes": ["subq", "im", "intranasal"],
        "common_protocols": [
            {"name": "Loading phase", "description": "250 mcg/day subQ for 7–10 days (with UV exposure for tan development), then taper to 500 mcg 1× weekly maintenance."},
        ],
        "side_effects": ["nausea", "flushing", "facial flushing", "spontaneous erections", "fatigue", "darkening of moles/skin", "yawning", "stretching"],
        "synergies": [],
    },
    {
        "slug": "tesamorelin",
        "name": "Tesamorelin",
        "aliases": ["Egrifta", "TH9507"],
        "description": (
            "Tesamorelin is a GHRH analogue FDA-approved for HIV-associated lipodystrophy. It stimulates "
            "endogenous GH secretion and has been studied for visceral fat reduction, cognitive function in "
            "older adults, and overall metabolic health."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Tesamorelin is FDA-approved only for HIV-associated lipodystrophy. Off-label use should only "
            "be undertaken under supervision of a qualified healthcare professional."
        ),
        "half_life_hours": 0.13,
        "recommended_dose_mcg_min": 1000.0,
        "recommended_dose_mcg_max": 2000.0,
        "max_dose_mcg": 2000.0,
        "frequency_notes": "Typically 1–2 mg subQ once daily, morning or before sleep. FDA-approved dose is 2 mg/day.",
        "storage_temp": "fridge",
        "routes": ["subq"],
        "common_protocols": [
            {"name": "Standard daily", "description": "2000 mcg subQ once daily in the morning (FDA protocol). Some use 1000 mcg/day for off-label purposes."},
        ],
        "side_effects": ["injection site redness/pain", "peripheral edema", "arthralgia", "carpal tunnel", "hyperglycemia", "nausea"],
        "synergies": ["Ipamorelin"],
    },
    {
        "slug": "retatrutide",
        "name": "Retatrutide",
        "aliases": ["LY3437943"],
        "description": (
            "Retatrutide is an investigational triple agonist targeting GLP-1, GIP, and glucagon receptors. "
            "Phase 2 trials have shown substantial weight reduction (up to 24% body weight) with once-weekly "
            "dosing. It is not yet FDA-approved and remains in clinical development."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Retatrutide is an investigational drug not approved for human use. Clinical trial data is preliminary. "
            "Use outside of clinical trials carries unknown risks. Consult a qualified healthcare professional."
        ),
        "half_life_hours": 168.0,
        "recommended_dose_mcg_min": 2000.0,
        "recommended_dose_mcg_max": 8000.0,
        "max_dose_mcg": 12000.0,
        "frequency_notes": "Once weekly subQ injection. Phase 2 trial doses ranged from 1 mg to 12 mg/week with slow titration over 24 weeks.",
        "storage_temp": "fridge",
        "routes": ["subq"],
        "common_protocols": [
            {"name": "Phase 2 titration", "description": "Start 2 mg/week → 4 mg/week (4 weeks) → 8 mg/week → 12 mg/week, titrating every 4 weeks per tolerance."},
        ],
        "side_effects": ["nausea", "vomiting", "diarrhea", "constipation", "decreased appetite", "abdominal pain", "fatigue", "injection site reactions"],
        "synergies": [],
    },
    {
        "slug": "semax",
        "name": "Semax",
        "aliases": ["ACTH 4-7 Pro8-Gly9-Pro10", "Heptapeptide Semax"],
        "description": (
            "Semax is a synthetic heptapeptide analogue of ACTH (4-7) developed in Russia. It is reported to "
            "enhance BDNF (brain-derived neurotrophic factor) expression, improve cognitive function, and offer "
            "neuroprotective effects. It is used clinically in Russia for stroke rehabilitation and cognitive enhancement."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Semax is not approved by the FDA. It is used clinically in Russia but remains a research chemical "
            "in most Western countries. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 0.25,
        "recommended_dose_mcg_min": 300.0,
        "recommended_dose_mcg_max": 600.0,
        "max_dose_mcg": 2000.0,
        "frequency_notes": "200–600 mcg intranasal 1–2× daily. Cycle 2–4 weeks on, 1–2 weeks off.",
        "storage_temp": "fridge",
        "routes": ["intranasal", "subq"],
        "common_protocols": [
            {"name": "Cognitive enhancement", "description": "300 mcg intranasal 2× daily (morning and midday) for 2–4 week cycles."},
            {"name": "Neuroprotection", "description": "600 mcg intranasal daily for 1–2 weeks post-acute stressor."},
        ],
        "side_effects": ["nasal irritation", "headache", "fatigue", "irritability", "vivid dreams", "elevated anxiety (high doses)"],
        "synergies": ["Selank"],
    },
    {
        "slug": "selank",
        "name": "Selank",
        "aliases": ["TP-7", "Tuftsin analogue"],
        "description": (
            "Selank is a synthetic analogue of tuftsin, an immunomodulatory peptide. Developed in Russia, "
            "it is reported to have anxiolytic, nootropic, and antidepressant properties. It acts on the "
            "GABAergic system and modulates BDNF. It is often used for anxiety reduction and cognitive clarity."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Selank is not FDA-approved. It is approved in Russia for anxiety and neurasthenia. "
            "Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 0.17,
        "recommended_dose_mcg_min": 250.0,
        "recommended_dose_mcg_max": 500.0,
        "max_dose_mcg": 3000.0,
        "frequency_notes": "250–500 mcg intranasal 1–3× daily as needed. Cycle 2–4 weeks on, 1 week off.",
        "storage_temp": "fridge",
        "routes": ["intranasal", "subq"],
        "common_protocols": [
            {"name": "Anxiolytic", "description": "250 mcg intranasal 2× daily (morning and evening) during high-stress periods."},
            {"name": "Nootropic stack with Semax", "description": "250 mcg Selank + 300 mcg Semax intranasal each morning."},
        ],
        "side_effects": ["nasal irritation", "mild sedation", "lethargy (high doses)", "mild euphoria", "fatigue"],
        "synergies": ["Semax"],
    },
    {
        "slug": "ghk-cu-injectable",
        "name": "GHK-Cu (Injectable)",
        "aliases": ["Copper Peptide GHK-Cu", "Glycyl-L-histidyl-L-lysine copper"],
        "description": (
            "GHK-Cu is a naturally occurring copper complex tripeptide found in human plasma. It has been "
            "studied for wound healing, anti-inflammatory effects, collagen synthesis stimulation, and "
            "antioxidant activity. The injectable form provides systemic delivery for broader regenerative effects."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Injectable GHK-Cu is not FDA-approved. Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 0.5,
        "recommended_dose_mcg_min": 100.0,
        "recommended_dose_mcg_max": 500.0,
        "max_dose_mcg": 1000.0,
        "frequency_notes": "100–500 mcg subQ or IM daily or every other day. Cycles of 4–8 weeks.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "Systemic regenerative", "description": "200–300 mcg subQ daily for 4–8 weeks for systemic anti-aging and wound healing support."},
        ],
        "side_effects": ["injection site redness", "skin darkening (copper-related)", "nausea", "headache"],
        "synergies": ["BPC-157", "TB-500"],
    },
    {
        "slug": "ghk-cu-topical",
        "name": "GHK-Cu (Topical)",
        "aliases": ["Copper Peptide Cream", "Copper Peptide Serum"],
        "description": (
            "Topical GHK-Cu formulations are used for skin regeneration, collagen production, wound healing, "
            "and anti-aging applications. Topical delivery targets local tissue without systemic injection. "
            "Widely studied in dermatology for scar reduction and skin quality improvement."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Topical GHK-Cu formulations are cosmetic products in most jurisdictions. "
            "Always patch-test before full application."
        ),
        "half_life_hours": None,
        "recommended_dose_mcg_min": None,
        "recommended_dose_mcg_max": None,
        "max_dose_mcg": None,
        "frequency_notes": "Apply topically 1–2× daily to target area. Concentrations typically 0.5–2% in formulation.",
        "storage_temp": "fridge",
        "routes": ["topical"],
        "common_protocols": [
            {"name": "Anti-aging skin protocol", "description": "Apply a 1–2% GHK-Cu serum to face/neck after cleansing, morning and evening."},
            {"name": "Scar reduction", "description": "Apply directly to scar tissue 2× daily with gentle massage for 8–12 weeks."},
        ],
        "side_effects": ["mild skin irritation", "temporary redness", "green-blue tinting (from copper)", "contact dermatitis (rare)"],
        "synergies": [],
    },
    {
        "slug": "epithalon",
        "name": "Epithalon",
        "aliases": ["Epitalon", "Epithalamin", "Ala-Glu-Asp-Gly"],
        "description": (
            "Epithalon is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) derived from the pineal gland peptide "
            "Epithalamin. It has been studied for telomere elongation, anti-aging effects, and regulation of "
            "melatonin production. Russian research suggests potential life-extension properties in animal models."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Epithalon is not FDA-approved and most data comes from animal and Russian clinical studies. "
            "Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 1.0,
        "recommended_dose_mcg_min": 5000.0,
        "recommended_dose_mcg_max": 10000.0,
        "max_dose_mcg": 20000.0,
        "frequency_notes": "5–10 mg/day subQ or IV for 10-day courses, 1–2 times per year. Some use 5 mg EOD for 20 doses.",
        "storage_temp": "freezer",
        "routes": ["subq", "im", "intranasal"],
        "common_protocols": [
            {"name": "10-day course", "description": "10 mg/day subQ for 10 consecutive days, twice yearly. Common anti-aging longevity protocol."},
            {"name": "EOD protocol", "description": "5 mg subQ every other day for 20 doses (40 days total)."},
        ],
        "side_effects": ["injection site discomfort", "fatigue", "mild headache", "improved sleep quality (positive effect)"],
        "synergies": [],
    },
    {
        "slug": "pt-141",
        "name": "PT-141",
        "aliases": ["Bremelanotide", "PL-6983"],
        "description": (
            "PT-141 (Bremelanotide) is a synthetic melanocortin receptor agonist derived from Melanotan II. "
            "It is FDA-approved (as Vyleesi) for hypoactive sexual desire disorder (HSDD) in premenopausal women. "
            "It acts centrally on MC3R/MC4R receptors to increase sexual desire, distinct from PDE5 inhibitors."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "PT-141 is FDA-approved as Vyleesi for HSDD in premenopausal women. Off-label use in men "
            "should only occur under supervision of a qualified healthcare professional."
        ),
        "half_life_hours": 2.7,
        "recommended_dose_mcg_min": 1000.0,
        "recommended_dose_mcg_max": 1750.0,
        "max_dose_mcg": 2000.0,
        "frequency_notes": "Administer 45 minutes before sexual activity. Max once per 24 hours. FDA dose: 1.75 mg subQ.",
        "storage_temp": "fridge",
        "routes": ["subq", "intranasal"],
        "common_protocols": [
            {"name": "FDA-approved (Vyleesi)", "description": "1750 mcg (1.75 mg) subQ into abdomen or thigh, 45 minutes before activity. Max 1× per day."},
            {"name": "Low-dose intranasal", "description": "500–1000 mcg intranasal 45–60 minutes before activity."},
        ],
        "side_effects": ["nausea", "flushing", "facial flushing", "headache", "hypertension (transient)", "hyperpigmentation (long term)", "vomiting"],
        "synergies": [],
    },
    {
        "slug": "glow",
        "name": "Glow (GHK-Cu / TB-500 / BPC-157)",
        "aliases": ["Glow Blend", "GHK-Cu:TB-500:BPC-157 50:10:10"],
        "description": (
            "Glow is a pre-mixed blend of GHK-Cu, TB-500, and BPC-157 in a 50:10:10 mcg ratio. "
            "It combines three peptides with overlapping regenerative, skin, and tissue repair "
            "actions into a single injection. Because each component has a different half-life, "
            "concentrations decay on independent curves after a single dose."
        ),
        "disclaimer": (
            "This information is for harm reduction purposes only. It is not medical advice. "
            "Glow is a research-chem blend; none of the components are FDA-approved for this use. "
            "Consult a qualified healthcare professional before use."
        ),
        "half_life_hours": 4.0,
        "recommended_dose_mcg_min": 70.0,
        "recommended_dose_mcg_max": 140.0,
        "max_dose_mcg": 280.0,
        "frequency_notes": "Typically 70 mcg (50 GHK-Cu / 10 TB-500 / 10 BPC-157) subQ daily or every other day, in cycles of 4–8 weeks.",
        "storage_temp": "fridge",
        "routes": ["subq", "im"],
        "common_protocols": [
            {"name": "Standard cycle", "description": "70 mcg subQ daily for 4–8 weeks (yields 50 mcg GHK-Cu + 10 mcg TB-500 + 10 mcg BPC-157 per dose)."},
            {"name": "Every other day", "description": "140 mcg subQ EOD for 8 weeks, for slower tapered exposure of each component."},
        ],
        "side_effects": ["injection site redness", "skin darkening (copper-related)", "nausea", "fatigue", "mild headache"],
        "synergies": ["BPC-157", "TB-500", "GHK-Cu"],
    },
]
