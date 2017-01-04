/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import { styles, fontScale } from './Styles';
import { NumberScrollField, ItemEditor } from './Widgets';
import type {ItemDefinition } from './Widgets';
import { PerimetryTest } from './EntranceTest';

export type SlitLampFindings = {
  conjunctiva: string,
  cornea: string,
  eyelids: string,
  iris: string,
  lens: string,
  sclera: string
}

function fetchSlitLampFindings(oculus: string): SlitLampFindings {
  const slitLampFindings: SlitLampFindings = {
    lens: 'Cataract anterior cortical 3+',
    conjutiva: 'Normal'
  }
  return slitLampFindings;
}

const slitLampFindingsDefinition: ItemDefinition = {
  conjunctiva: {
    label: 'Conjunctiva',
    options: ['Normal', 'Amyloidosis', 'Angioma', 'Bleb Bulbar', 'Chemosis', 'Cyst', 'Edema', 'Flat', 'Follicles', 'Hyperemia', 'Lesion', 'Nevus', 'Papillae', 'Phylectenule', 'Pinguencula', 'Pseudomembrane', 'Pterygium', 'Scar', 'Staining', 'Symblepharon inferior', 'Symblepharon superior'],
    normalValue: 'Normal',
    required: true
  },
  lens: {
    label: 'Lens',
    options: ['Normal', 'Aphakai', 'Cataract anterior cotical', 'Cataract congenital', 'Cataract posterior cortical', 'Cataract anterior polar', 'Cataract Morganian', 'Cataract posterior polar', 'Mittendorf dot', 'Pigment', 'Pseudoexfoliation', 'Subfluxated', 'Vacuoles', 'Vossius ring'],
    normalValue: 'Normal',
    required: true
  },
  cornea: {
    label: 'Cornea',
    options: ['Normal', 'Abrasion', 'Arcus senilis', 'Circumlimbal vessel encroachment', 'Clear corneal incision', 'Corneal Ulcer', 'Dellen', 'Dendriform', 'Dendrite', 'Dystrophy', 'Edema', 'Epithelial defect', 'Epithelial erosion', 'Fungal', 'Filaments', 'Fleischers\' ring', 'Foreign body', 'Fuchis', 'Fuchs Dystrophy', 'Ghost vessels', 'Graft clear', 'Guttata', 'Hydrops', 'KP-Fine', 'Kruckenberg spindle', 'Laceration', 'Lattice', 'Linear defect', 'Map-dot', 'Marginal', 'Megalocornea', 'Microcornea', 'Munson\'s sign', 'Neovascularization', 'Opacity', 'Pannus', 'Pinguecula', 'Pterygium', 'Recurrent erosion', 'Salzmann\'s', 'Scar', 'Staining', 'Striae/folds', 'Superficial punctate keratitis', 'Trantas dots', 'Ulcer'],
    normalValue: 'Normal',
    required: true
  },
  eyelids: {
    label: 'Eyelids',
    options: ['Normal', 'Ariis line', 'Blepharitis', 'Blepharochalasis', 'Blepharophimosis', 'Blepheritis-Pediculosis', 'Chalazion', 'Concretion', 'Demodicosis', 'Dermatochalasis', 'Discharge', 'Ecchymosis', 'Extropion', 'Edema', 'Entropion', 'Epiblepharon', 'Floppy lid', 'Follicles', 'Foreign body', 'Herniated fat', 'Herpes zoster', 'Hordeolum'],
    normalValue: 'Normal',
    required: true
  },
  iris: {
    label: 'Iris',
    options: ['Normal', 'Albinism', 'Anterior synechiae', 'Atrophy', 'Coloboma-keyhole', 'Heterochromia', 'ICE syndrome', 'Iris bombay', 'Persistan pupillary membrane', 'Posterior synechiae', 'Transillumination'],
    normalValue: 'Normal',
    required: true
  },
  sclera: {
    label: 'Sclera',
    options: ['Normal', 'Blue Sclera', 'Edema', 'Episcleritis', 'Hyperpigmentation', 'Injection', 'Nodule', 'Staphyloma', 'Thinning'],
    normalValue: 'Normal',
    required: true
  }
}

export class SlitLampScreen extends Component {
  state: {
    odFindings: SlitLampFindings,
    osFindings: SlitLampFindings
  }
  constructor(props: any) {
    super(props);
    this.state = {
      odFindings: {},
      osFindings: {}
    }
  }

  componentDidMount() {
    const odFindings: SlitLampFindings = fetchSlitLampFindings('OD');
    const osFindings: SlitLampFindings = fetchSlitLampFindings('OD');
    this.setState({
      odFindings: odFindings,
      osFindings: osFindings
    });
  }

  render() {
    return <View>
      <View style={{ flex: 50 }}>
        <ItemEditor
          title='OD'
          oneLineHeader={true}
          item={this.state.odFindings}
          itemDefinition={slitLampFindingsDefinition}
          />
      </View>
    </View >
  }
}
