use 764_p11lj2;

#allergyCodes updates
UPDATE lists SET `description_en` = 'Amoxicillin' WHERE (`description_en` = 'Amoxicilline' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Acetaminophen' WHERE (`description_en` = 'Acetaminophene' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Amiloxyn' WHERE (`description_en` = 'Amyxyne' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Aspirin' WHERE (`description_en` = 'Aspirine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Eggplant' WHERE (`description_en` = 'Aubergine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Azithromycin' WHERE (`description_en` = 'Azithromycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Capsaicin' WHERE (`description_en` = 'Capsaicine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Curry' WHERE (`description_en` = 'Cari' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Clarithromycin' WHERE (`description_en` = 'Clarithromycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Clindamycin' WHERE (`description_en` = 'Clindamycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Erythromycin' WHERE (`description_en` = 'Erythromycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Fucithalmic' WHERE (`description_en` = 'Fucitalmic' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Ibuprofen' WHERE (`description_en` = 'Ibuprofene' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Iodine' WHERE (`description_en` = 'Iode' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Lecithin' WHERE (`description_en` = 'Lecithinine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Lincomycin' WHERE (`description_en` = 'Lincomycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Corn' WHERE (`description_en` = 'Mais' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Mercury' WHERE (`description_en` = 'Mercure' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Penicillin' WHERE (`description_en` = 'Penecilline' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Pineapple' WHERE (`description_en` = 'Pineaple' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Rabbit' WHERE (`description_en` = 'Rabit' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Tetanus' WHERE (`description_en` = 'Tetanos' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Tobramycin' WHERE (`description_en` = 'Tobramycine' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Zinc' WHERE (`description_en` = 'Zinc PNC' AND list_name = 'allergyCodes');
UPDATE lists SET `description_en` = 'Zithromax' WHERE (`description_en` = 'Zitromax' AND list_name = 'allergyCodes');

#allergyCodes removals
DELETE FROM lists WHERE (`description_en` = 'Urticaire' AND list_name = 'allergyCodes');
DELETE FROM lists WHERE (`description_en` = 'Zilocaine' AND list_name = 'allergyCodes');
DELETE FROM lists WHERE (`description_en` = 'Zytromax' AND list_name = 'allergyCodes');

#allergyReactionCodes update/insert
UPDATE lists SET `description_en` = 'Diarrhea' WHERE (`description_en` = 'Diarhea' AND list_name = 'allergyReactionCodes');
INSERT INTO lists (list_name, description_en, description_fr, rank_en, rank_fr, rank_it, rank_es)
    VALUES ('allergyReactionCodes', 'Urticaria', 'Urticaria', 0, 0, 0, 0);

#medicationCodes updates
UPDATE lists SET `description_en` = 'Acetaminophen' WHERE (`description_en` = 'Acetaminophene' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Aspirin' WHERE (`description_en` = 'Aspirine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Azithromycin' WHERE (`description_en` = 'Azithromycine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Hyperbaric Chamber' WHERE (`description_en` = 'Certraline' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Zyprexa' WHERE (`description_en` = 'Ciprexa' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Clindamycin' WHERE (`description_en` = 'Clindamycine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Desyrel' WHERE (`description_en` = 'Desirel' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Diuretic' WHERE (`description_en` = 'Diuretique' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Doxycycline' WHERE (`description_en` = 'Doxycline' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Folic Acid' WHERE (`description_en` = 'Folic' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Generic Cholesterol Pill' WHERE (`description_en` = 'Generique choles' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Heparin' WHERE (`description_en` = 'Heparine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Insulin' WHERE (`description_en` = 'Insuline' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Lutein' WHERE (`description_en` = 'Luteine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Melatonin' WHERE (`description_en` = 'Melatonine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'MultiVitamin' WHERE (`description_en` = 'Multivitamine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Niacin' WHERE (`description_en` = 'Niacine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Oxycodone' WHERE (`description_en` = 'Oxicodine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Oxybutynin' WHERE (`description_en` = 'Oxybutynine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Oxygen' WHERE (`description_en` = 'Oxygene' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Penicillin' WHERE (`description_en` = 'Penecilline' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Pill' WHERE (`description_en` = 'Pillule' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Premarin' WHERE (`description_en` = 'Premarine' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Probiotic' WHERE (`description_en` = 'Probiotique' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Symbicort' WHERE (`description_en` = 'Simbicor' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Tamoxifen' WHERE (`description_en` = 'Tamoxifene' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin B1' WHERE (`description_en` = 'Vitamine B1' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin B6' WHERE (`description_en` = 'Vitamine B6' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin B12' WHERE (`description_en` = 'Vitamine B12' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin C' WHERE (`description_en` = 'Vitamine C' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin D' WHERE (`description_en` = 'Vitamine D' AND list_name = 'medicationCodes');
UPDATE lists SET `description_en` = 'Vitamin E' WHERE (`description_en` = 'Vitamine E' AND list_name = 'medicationCodes');

#medicationCodes removals
DELETE FROM lists WHERE (`description_en` = 'Chambre hyperbare' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Estomac' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Finasterid' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'HTN' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Hydrochlor' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Hydromorph' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Parkinson' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Pression' AND list_name = 'medicationCodes');
DELETE FROM lists WHERE (`description_en` = 'Prostate' AND list_name = 'medicationCodes');


