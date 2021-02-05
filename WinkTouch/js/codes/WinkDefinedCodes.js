/**
 * @flow
 */
'use strict';

import type {CodeDefinition} from '../Types';
import {icdCodes} from './IcdCodes';
import {sinceCodes} from './SinceCodes';
import {chiefComplaintCodes} from './ChiefComplaintCodes';
import {complaintLocationCodes} from './ComplaintLocationCodes';
import {complaintQualityCodes} from './ComplaintQualityCodes';
import {complaintSeverityCodes} from './ComplaintSeverityCodes';
import {complaintTimingCodes} from './ComplaintTimingCodes';
import {complaintDurationCodes} from './ComplaintDurationCodes';
import {complaintContextCodes} from './ComplaintContextCodes';
import {complaintFactorCodes} from './ComplaintFactorCodes';
import {complaintSignCodes} from './ComplaintSignCodes';
import {frequencyCodes} from './FrequencyCodes';
import {dominantEyeCodes} from './DominantEyeCodes';
import {lateralTropiaCodes} from './LateralTropiaCodes';
import {verticalTropiaCodes} from './VerticalTropiaCodes';
import {lateralPhoriaCodes} from './LateralPhoriaCodes';
import {verticalPhoriaCodes} from './VerticalPhoriaCodes';
import {extraOcularMotilityCodes} from './ExtraOcularMotilityCodes';
import {lidLashesCodes} from './AnteriorCodes';
import {conjunctivaCodes} from './AnteriorCodes';
import {corneaCodes} from './AnteriorCodes';
import {aCSuffixCodes} from './AnteriorCodes';
import {irisCodes} from './AnteriorCodes';
import {lensCodes} from './AnteriorCodes';
import {posteriorLensCodes} from './PosteriorCodes';
import {vitreousCodes} from './PosteriorCodes';
import {opticDiscCodes} from './PosteriorCodes';
import {cdrCodes} from './PosteriorCodes';
import {vesselsCodes} from './PosteriorCodes';
import {maculaCodes} from './PosteriorCodes';
import {retinaCodes} from './PosteriorCodes';
import {peripheryCodes} from './PosteriorCodes';
import {pupillaryReflexCodes} from './PosteriorCodes';
import {dilationDrugCodes} from './DilationCodes';
import {dilationEyeCodes} from './DilationCodes';
import {colorVisionTestCodes} from './ColorVisionCodes';
import {colorVisionDiagnoseCodes} from './ColorVisionCodes';
import {pupilFormCodes} from './PupilCodes';
import {pupilReactionCodes} from './PupilCodes';
import {pupilMGunnCodes} from './PupilCodes';
import {pupilAccomodationCodes} from './PupilCodes';
import {hirschbergCodes} from './PupilCodes';
import {brucknerCodes} from './PupilCodes';
import {pupilDiagnoseCodes} from './PupilCodes';
import {iopDrugCodes} from './IopCodes';
import {tonometryTestCodes} from './IopCodes';
import {
  medicationStrengthCodes,
  medicationDosageCodes,
  medicationDurationCodes,
  medicationInstructionCodes,
  medicationRefillCodes,
  medicationCodes,
} from './MedicationCodes';
import {gonioscopyLensCodes} from './GonioscopyCodes';
import {irisPaternCodes} from './GonioscopyCodes';
import {gonioPigmentCodes} from './GonioscopyCodes';
import {gonioInsertionCodes} from './GonioscopyCodes';
import {ocularMedicationCodes} from './OcularMedicationCodes';
import {ocularMedicationDosageCodes} from './OcularMedicationCodes';
import {ocularRouteCodes} from './OcularMedicationCodes';
import {allergyCodes} from './AllergyCodes';
import {allergyReactionCodes} from './AllergyCodes';
import {familyRelationCodes} from './FamilyHistoryCodes';
import {familyDiseaseCodes} from './FamilyHistoryCodes';
import {familyDiseaseSinceCodes} from './FamilyHistoryCodes';
import {medicalConditionCodes} from './FamilyHistoryCodes';
import {tobaccoUseCodes} from './SocialHistoryCodes';
import {alcoholUseCodes} from './SocialHistoryCodes';
import {drugUseCodes} from './SocialHistoryCodes';
import {
  clGoodToBadCodes,
  clRotationCodes,
  clMovementCodes,
  clCentrationCodes,
  clNormalTo5Codes,
  clSolutionCodes,
  contactLenses,
  clFittingTypeCodes,
  clReplacementCodes,
  clComfortCodes,
  clWearingHabitCodes,
  clCleaningHabitCodes,
} from './ContactLensCodes';
import {lensTypeCodes} from './RefractionCodes';
import {prescriptionCodes} from './PrescriptionCodes';
import {eyeColorCodes} from './BiomicroscopyCodes';
import {
  diabetesTypeCodes,
  diabetesControlCodes,
  diabetesSeverityCodes,
  diabetesPresentationCodes,
  diabetesDurationCodes,
  diabetesTimingCodes,
  diabetesModifyingFactorCodes,
} from './DiabetesCodes';
import {occupationCodes, hobbyCodes, computerUseCodes} from './LifestyleCodes';
import {
  rosGeneralCodes,
  rosEarCodes,
  rosNoseCodes,
  rosAllergicCodes,
  rosMouthCodes,
  rosSkinCodes,
  rosHeadCodes,
  rosNeckCodes,
  rosRespiratoryCodes,
  rosGastroCodes,
  rosUrinaryCodes,
  rosMusculosketletalCodes,
  rosNeurologicCodes,
  rosEndocrineCodes,
  rosHematologicCodes,
  rosPeripheralCodes,
  rosPshychiatricCodes,
} from './ReviewOfSystemCodes';
import {stereoFlyCodes} from './SteropsisCodes';
import {
  confrontationVFCodes,
  autoPerimetryVFCodes,
  autoPerimetryInstrumentCodes,
} from './VisualFieldCodes';
import {currentWearCodes} from './AutoRefCodes';

export function initialiseWinkCodes(codeDefinitions: [CodeDefinition]): void {
  codeDefinitions.icdCodes = icdCodes;
  codeDefinitions.procedureCodes = [];
  codeDefinitions.sinceCodes = sinceCodes;
  codeDefinitions.chiefComplaintCodes = chiefComplaintCodes;
  codeDefinitions.complaintLocationCodes = complaintLocationCodes;
  codeDefinitions.complaintQualityCodes = complaintQualityCodes;
  codeDefinitions.complaintSeverityCodes = complaintSeverityCodes;
  codeDefinitions.complaintTimingCodes = complaintTimingCodes;
  codeDefinitions.complaintDurationCodes = complaintDurationCodes;
  codeDefinitions.complaintContextCodes = complaintContextCodes;
  codeDefinitions.complaintFactorCodes = complaintFactorCodes;
  codeDefinitions.complaintSignCodes = complaintSignCodes;
  codeDefinitions.frequencyCodes = frequencyCodes;
  codeDefinitions.dominantEyeCodes = dominantEyeCodes;
  codeDefinitions.lateralTropiaCodes = lateralTropiaCodes;
  codeDefinitions.verticalTropiaCodes = verticalTropiaCodes;
  codeDefinitions.lateralPhoriaCodes = lateralPhoriaCodes;
  codeDefinitions.verticalPhoriaCodes = verticalPhoriaCodes;
  codeDefinitions.extraOcularMotilityCodes = extraOcularMotilityCodes;
  codeDefinitions.lidLashesCodes = lidLashesCodes;
  codeDefinitions.conjunctivaCodes = conjunctivaCodes;
  codeDefinitions.corneaCodes = corneaCodes;
  codeDefinitions.aCSuffixCodes = aCSuffixCodes;
  codeDefinitions.irisCodes = irisCodes;
  codeDefinitions.lensCodes = lensCodes;
  codeDefinitions.posteriorLensCodes = posteriorLensCodes;
  codeDefinitions.vitreousCodes = vitreousCodes;
  codeDefinitions.opticDiscCodes = opticDiscCodes;
  codeDefinitions.vesselsCodes = vesselsCodes;
  codeDefinitions.maculaCodes = maculaCodes;
  codeDefinitions.retinaCodes = retinaCodes;
  codeDefinitions.peripheryCodes = peripheryCodes;
  codeDefinitions.cdrCodes = cdrCodes;
  codeDefinitions.dilationDrugCodes = dilationDrugCodes;
  codeDefinitions.dilationEyeCodes = dilationEyeCodes;
  codeDefinitions.colorVisionTestCodes = colorVisionTestCodes;
  codeDefinitions.colorVisionDiagnoseCodes = colorVisionDiagnoseCodes;
  codeDefinitions.pupilFormCodes = pupilFormCodes;
  codeDefinitions.pupilReactionCodes = pupilReactionCodes;
  codeDefinitions.pupilMGunnCodes = pupilMGunnCodes;
  codeDefinitions.pupilAccomodationCodes = pupilAccomodationCodes;
  codeDefinitions.pupilDiagnoseCodes = pupilDiagnoseCodes;
  codeDefinitions.hirschbergCodes = hirschbergCodes;
  codeDefinitions.brucknerCodes = brucknerCodes;
  codeDefinitions.iopDrugCodes = iopDrugCodes;
  codeDefinitions.tonometryTestCodes = tonometryTestCodes;
  codeDefinitions.medicationStrengthCodes = medicationStrengthCodes;
  codeDefinitions.medicationDosageCodes = medicationDosageCodes;
  codeDefinitions.medicationDurationCodes = medicationDurationCodes;
  codeDefinitions.medicationCodes = medicationCodes;
  codeDefinitions.gonioscopyLensCodes = gonioscopyLensCodes;
  codeDefinitions.irisPaternCodes = irisPaternCodes;
  codeDefinitions.gonioPigmentCodes = gonioPigmentCodes;
  codeDefinitions.gonioInsertionCodes = gonioInsertionCodes;
  codeDefinitions.ocularMedicationCodes = ocularMedicationCodes;
  codeDefinitions.ocularMedicationDosageCodes = ocularMedicationDosageCodes;
  codeDefinitions.ocularRouteCodes = ocularRouteCodes;
  codeDefinitions.allergyCodes = allergyCodes;
  codeDefinitions.allergyReactionCodes = allergyReactionCodes;
  codeDefinitions.familyRelationCodes = familyRelationCodes;
  codeDefinitions.familyDiseaseCodes = familyDiseaseCodes;
  codeDefinitions.familyDiseaseSinceCodes = familyDiseaseSinceCodes;
  codeDefinitions.medicalConditionCodes = medicalConditionCodes;
  codeDefinitions.tobaccoUseCodes = tobaccoUseCodes;
  codeDefinitions.alcoholUseCodes = alcoholUseCodes;
  codeDefinitions.drugUseCodes = drugUseCodes;
  codeDefinitions.clComfortCodes = clGoodToBadCodes;
  codeDefinitions.clVisionCodes = clGoodToBadCodes;
  codeDefinitions.clRotationCodes = clRotationCodes;
  codeDefinitions.clMovementCodes = clMovementCodes;
  codeDefinitions.clCentrationCodes = clCentrationCodes;
  codeDefinitions.clTearCodes = clNormalTo5Codes;
  codeDefinitions.clScleraCodes = clNormalTo5Codes;
  codeDefinitions.clLimbalCodes = clNormalTo5Codes;
  codeDefinitions.clCorneaCodes = clNormalTo5Codes;
  codeDefinitions.clLidCodes = clNormalTo5Codes;
  codeDefinitions.clSolutionCodes = clSolutionCodes;
  codeDefinitions.contactLenses = contactLenses;
  codeDefinitions.lensTypeCodes = lensTypeCodes;
  codeDefinitions.clFittingTypeCodes = clFittingTypeCodes;
  codeDefinitions.prescriptionCodes = prescriptionCodes;
  codeDefinitions.eyeColorCodes = eyeColorCodes;
  codeDefinitions.pupillaryReflexCodes = pupillaryReflexCodes;
  codeDefinitions.clReplacementCodes = clReplacementCodes;
  codeDefinitions.clComfortCodes = clComfortCodes;
  codeDefinitions.clWearingHabitCodes = clWearingHabitCodes;
  codeDefinitions.clCleaningHabitCodes = clCleaningHabitCodes;
  codeDefinitions.diabetesTypeCodes = diabetesTypeCodes;
  codeDefinitions.diabetesControlCodes = diabetesControlCodes;
  codeDefinitions.diabetesSeverityCodes = diabetesSeverityCodes;
  codeDefinitions.diabetesPresentationCodes = diabetesPresentationCodes;
  codeDefinitions.diabetesDurationCodes = diabetesDurationCodes;
  codeDefinitions.diabetesTimingCodes = diabetesTimingCodes;
  codeDefinitions.diabetesModifyingFactorCodes = diabetesModifyingFactorCodes;
  codeDefinitions.occupationCodes = occupationCodes;
  codeDefinitions.hobbyCodes = hobbyCodes;
  codeDefinitions.computerUseCodes = computerUseCodes;
  codeDefinitions.medicationInstructionCodes = medicationInstructionCodes;
  codeDefinitions.medicationRefillCodes = medicationRefillCodes;
  codeDefinitions.rosGeneralCodes = rosGeneralCodes;
  codeDefinitions.rosEarCodes = rosEarCodes;
  codeDefinitions.rosNoseCodes = rosNoseCodes;
  codeDefinitions.rosAllergicCodes = rosAllergicCodes;
  codeDefinitions.rosMouthCodes = rosMouthCodes;
  codeDefinitions.rosSkinCodes = rosSkinCodes;
  codeDefinitions.rosHeadCodes = rosHeadCodes;
  codeDefinitions.rosNeckCodes = rosNeckCodes;
  codeDefinitions.rosRespiratoryCodes = rosRespiratoryCodes;
  codeDefinitions.rosGastroCodes = rosGastroCodes;
  codeDefinitions.rosUrinaryCodes = rosUrinaryCodes;
  codeDefinitions.rosMusculosketletalCodes = rosMusculosketletalCodes;
  codeDefinitions.rosNeurologicCodes = rosNeurologicCodes;
  codeDefinitions.rosEndocrineCodes = rosEndocrineCodes;
  codeDefinitions.rosHematologicCodes = rosHematologicCodes;
  codeDefinitions.rosPeripheralCodes = rosPeripheralCodes;
  codeDefinitions.rosPshychiatricCodes = rosPshychiatricCodes;
  codeDefinitions.stereoFlyCodes = stereoFlyCodes;
  codeDefinitions.confrontationVFCodes = confrontationVFCodes;
  codeDefinitions.autoPerimetryVFCodes = autoPerimetryVFCodes;
  codeDefinitions.autoPerimetryInstrumentCodes = autoPerimetryInstrumentCodes;
  codeDefinitions.machineTypeCodes = [];
  codeDefinitions.machines = [];
  codeDefinitions.currentWearCodes = currentWearCodes;
  codeDefinitions.referralTemplates = [];
}
