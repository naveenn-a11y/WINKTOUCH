use 764_p11lj2;

#diabetesPresentationCodes updates
UPDATE lists SET `description_en` = 'Less than 6 months' WHERE (`description_en` = 'less then 6 months' AND list_name = 'diabetesPresentationCodes');

#frequencyCodes updates
UPDATE lists SET `description_en` = 'ID', `description_fr` = 'ID' WHERE (`description_en` = 'QD' AND list_name = 'frequencyCodes');
