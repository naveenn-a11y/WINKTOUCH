use 764_p11lj2;

#clWearingHabitCodes updates
UPDATE lists SET description_en = 'Over usage' where list_name = 'clWearingHabitCodes' AND description_en = 'Overusage'

#medicationDosageCodes updates
UPDATE lists SET description_en = '4 gtts' where list_name = 'medicationDosageCodes' AND description_en = '5 gtts'
UPDATE lists SET description_fr = '4 gtts' where list_name = 'medicationDosageCodes' AND description_fr = '5 gtts'

#medicalConditionCodes updates
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=1,rank_es=1 where list_name = 'medicalConditionCodes' AND description_en = 'No medical condition'
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=2,rank_es=2 where list_name = 'medicalConditionCodes' AND description_en = 'Arthritis'
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=3,rank_es=3 where list_name = 'medicalConditionCodes' AND description_en = 'Cancer'
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=4,rank_es=4 where list_name = 'medicalConditionCodes' AND description_en = 'Diabetes'
UPDATE lists SET rank_en=5,rank_fr=5,rank_it=5,rank_es=5 where list_name = 'medicalConditionCodes' AND description_en = 'Headaches / Migraines'
UPDATE lists SET rank_en=6,rank_fr=6,rank_it=6,rank_es=6 where list_name = 'medicalConditionCodes' AND description_en = 'Heart disease'
UPDATE lists SET rank_en=7,rank_fr=7,rank_it=7,rank_es=7 where list_name = 'medicalConditionCodes' AND description_en = 'High blood pressure'
UPDATE lists SET rank_en=8,rank_fr=8,rank_it=8,rank_es=8 where list_name = 'medicalConditionCodes' AND description_en = 'High cholesterol'
UPDATE lists SET rank_en=9,rank_fr=9,rank_it=9,rank_es=9 where list_name = 'medicalConditionCodes' AND description_en = 'Thyroid problems'

#rosAllergicCodes updates
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80473;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80477;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80478;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80476;
UPDATE lists SET rank_en=5,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80474;
UPDATE lists SET rank_en=6,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80479;
UPDATE lists SET rank_en=7,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosAllergicCodes' AND idlists = 80475;

#rosBreastCodes updates
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosBreastCodes' AND idlists = 81049;
UPDATE lists SET rank_en=2,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosBreastCodes' AND idlists = 81052;
UPDATE lists SET rank_en=3,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosBreastCodes' AND idlists = 81050;
UPDATE lists SET rank_en=4,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosBreastCodes' AND idlists = 81051;

#rosEarCodes updates
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81907;
UPDATE lists SET rank_en=2,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81908;
UPDATE lists SET rank_en=3,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81912;
UPDATE lists SET rank_en=4,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81910;
UPDATE lists SET rank_en=5,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81909;
UPDATE lists SET rank_en=6,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosEarCodes' AND idlists = 81911;

#rosEndocrineCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 80995;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 80996;
UPDATE lists SET rank_en=3,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 81002;
UPDATE lists SET rank_en=4,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 81004;
UPDATE lists SET rank_en=5,rank_fr=10,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 81003;
UPDATE lists SET rank_en=6,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 81001;
UPDATE lists SET rank_en=7,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 80997;
UPDATE lists SET rank_en=8,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 80998;
UPDATE lists SET rank_en=9,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 80999;
UPDATE lists SET rank_en=10,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosEndocrineCodes' AND idlists = 81000;

#rosGastroCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80586;
UPDATE lists SET rank_en=2,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80596;
UPDATE lists SET rank_en=3,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80595;
UPDATE lists SET rank_en=4,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80587;
UPDATE lists SET rank_en=5,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80588;
UPDATE lists SET rank_en=6,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80593;
UPDATE lists SET rank_en=7,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80594;
UPDATE lists SET rank_en=8,rank_fr=14,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80597;
UPDATE lists SET rank_en=9,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80598;
UPDATE lists SET rank_en=10,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80600;
UPDATE lists SET rank_en=11,rank_fr=10,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80590;
UPDATE lists SET rank_en=12,rank_fr=12,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80589;
UPDATE lists SET rank_en=13,rank_fr=13,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80601;
UPDATE lists SET rank_en=14,rank_fr=15,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80591;
UPDATE lists SET rank_en=15,rank_fr=16,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80592;
UPDATE lists SET rank_en=16,rank_fr=11,rank_it=NULL,rank_es=NULL where list_name = 'rosGastroCodes' AND idlists = 80599;

#rosGeneralCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80865;
UPDATE lists SET rank_en=2,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80869;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80871;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80868;
UPDATE lists SET rank_en=5,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80870;
UPDATE lists SET rank_en=6,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80872;
UPDATE lists SET rank_en=7,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80867;
UPDATE lists SET rank_en=8,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosGeneralCodes' AND idlists = 80866;

#rosHeadCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosHeadCodes' AND idlists = 82156;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosHeadCodes' AND idlists = 82158;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosHeadCodes' AND idlists = 82157;

#rosHematologicCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosHematologicCodes' AND idlists = 81927;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosHematologicCodes' AND idlists = 81928;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosHematologicCodes' AND idlists = 81929;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosHematologicCodes' AND idlists = 81930;

#rosMouthCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80801;
UPDATE lists SET rank_en=2,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80808;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80807;
UPDATE lists SET rank_en=4,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80802;
UPDATE lists SET rank_en=5,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80805;
UPDATE lists SET rank_en=6,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80806;
UPDATE lists SET rank_en=7,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80803;
UPDATE lists SET rank_en=8,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosMouthCodes' AND idlists = 80804;

#rosMusculosketletalCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80577;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80584;
UPDATE lists SET rank_en=3,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80582;
UPDATE lists SET rank_en=4,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80581;
UPDATE lists SET rank_en=5,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80585;
UPDATE lists SET rank_en=6,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80578;
UPDATE lists SET rank_en=7,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80583;
UPDATE lists SET rank_en=8,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80580;
UPDATE lists SET rank_en=9,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosMusculosketletalCodes' AND idlists = 80579;

#rosNeckCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosNeckCodes' AND idlists = 81918;
UPDATE lists SET rank_en=2,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosNeckCodes' AND idlists = 81921;
UPDATE lists SET rank_en=3,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosNeckCodes' AND idlists = 81919;
UPDATE lists SET rank_en=4,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosNeckCodes' AND idlists = 81922;
UPDATE lists SET rank_en=5,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosNeckCodes' AND idlists = 81920;

#rosNeurologicCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80809;
UPDATE lists SET rank_en=2,rank_fr=11,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80821;
UPDATE lists SET rank_en=3,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80810;
UPDATE lists SET rank_en=4,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80819;
UPDATE lists SET rank_en=5,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80818;
UPDATE lists SET rank_en=6,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80812;
UPDATE lists SET rank_en=7,rank_fr=10,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80815;
UPDATE lists SET rank_en=8,rank_fr=12,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80816;
UPDATE lists SET rank_en=9,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80820;
UPDATE lists SET rank_en=10,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80813;
UPDATE lists SET rank_en=11,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80811;
UPDATE lists SET rank_en=12,rank_fr=13,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80817;
UPDATE lists SET rank_en=13,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosNeurologicCodes' AND idlists = 80814;

#rosNoseCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosNoseCodes' AND idlists = 81944;
UPDATE lists SET rank_en=2,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosNoseCodes' AND idlists = 81946;
UPDATE lists SET rank_en=3,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosNoseCodes' AND idlists = 81945;
UPDATE lists SET rank_en=4,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosNoseCodes' AND idlists = 81947;

#rosPeripheralCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosPeripheralCodes' AND idlists = 80750;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosPeripheralCodes' AND idlists = 80753;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosPeripheralCodes' AND idlists = 80751;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosPeripheralCodes' AND idlists = 80752;

#rosPsychiatricCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80756;
UPDATE lists SET rank_en=2,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80758;
UPDATE lists SET rank_en=3,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80760;
UPDATE lists SET rank_en=4,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80762;
UPDATE lists SET rank_en=5,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80761;
UPDATE lists SET rank_en=6,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80759;
UPDATE lists SET rank_en=7,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosPshychiatricCodes' AND idlists = 80757;

#rosRespiratoryCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80498;
UPDATE lists SET rank_en=2,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80509;
UPDATE lists SET rank_en=3,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80516;
UPDATE lists SET rank_en=4,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80504;
UPDATE lists SET rank_en=5,rank_fr=14,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80518;
UPDATE lists SET rank_en=6,rank_fr=24,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80500;
UPDATE lists SET rank_en=7,rank_fr=23,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80503;
UPDATE lists SET rank_en=8,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80511;
UPDATE lists SET rank_en=9,rank_fr=11,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80506;
UPDATE lists SET rank_en=10,rank_fr=20,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80514;
UPDATE lists SET rank_en=11,rank_fr=12,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80519;
UPDATE lists SET rank_en=12,rank_fr=18,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80510;
UPDATE lists SET rank_en=13,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80513;
UPDATE lists SET rank_en=14,rank_fr=13,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80512;
UPDATE lists SET rank_en=15,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80520;
UPDATE lists SET rank_en=16,rank_fr=22,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80507;
UPDATE lists SET rank_en=17,rank_fr=21,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80505;
UPDATE lists SET rank_en=18,rank_fr=17,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80521;
UPDATE lists SET rank_en=19,rank_fr=15,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80501;
UPDATE lists SET rank_en=20,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80517;
UPDATE lists SET rank_en=21,rank_fr=10,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80499;
UPDATE lists SET rank_en=22,rank_fr=16,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80515;
UPDATE lists SET rank_en=23,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80508;
UPDATE lists SET rank_en=24,rank_fr=25,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80522;
UPDATE lists SET rank_en=25,rank_fr=19,rank_it=NULL,rank_es=NULL where list_name = 'rosRespiratoryCodes' AND idlists = 80502;

#rosSkinCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosSkinCodes' AND idlists = 82149;
UPDATE lists SET rank_en=2,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosSkinCodes' AND idlists = 82152;
UPDATE lists SET rank_en=3,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosSkinCodes' AND idlists = 82151;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosSkinCodes' AND idlists = 82150;

#rosUrinaryCodes
UPDATE lists SET rank_en=1,rank_fr=1,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80780;
UPDATE lists SET rank_en=2,rank_fr=10,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80788;
UPDATE lists SET rank_en=3,rank_fr=5,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80787;
UPDATE lists SET rank_en=4,rank_fr=4,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80781;
UPDATE lists SET rank_en=5,rank_fr=9,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80786;
UPDATE lists SET rank_en=6,rank_fr=3,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80783;
UPDATE lists SET rank_en=7,rank_fr=7,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80785;
UPDATE lists SET rank_en=8,rank_fr=6,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80782;
UPDATE lists SET rank_en=9,rank_fr=2,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80784;
UPDATE lists SET rank_en=10,rank_fr=8,rank_it=NULL,rank_es=NULL where list_name = 'rosUrinaryCodes' AND idlists = 80789;