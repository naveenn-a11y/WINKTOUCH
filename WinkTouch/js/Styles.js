import { StyleSheet, Dimensions, Platform, UIManager } from 'react-native';

export const windowWidth : number = Dimensions.get('window').width;
export const windowHeight : number = Dimensions.get('window').height;

export const fontScale = 0.8 * Math.min(windowWidth / 1024,
  windowHeight / 768)


export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

if (isAndroid) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const backgroundColor = undefined;
export const fontColor = undefined;
export const selectionColor = '#ddddffdd';
export const selectionFontColor = '#4444ff';
export const selectionBackgroundColor = '#5067ff';

export const styles = StyleSheet.create({
    screeen: {
        flex: 100,
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: backgroundColor,
    },
    centeredScreenLayout: {
        flex: 100,
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    page: {
        flex: 100,
        flexDirection: 'column',
        backgroundColor: backgroundColor,
    },
    sideMenu: {
        padding: 15 * fontScale,
        backgroundColor: '#F7F7F9',
        shadowColor: 'gray',
        shadowOpacity: 0.7,
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    findResults: {
        flex: 0,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 6 * fontScale
    },
    h1: {
        fontSize: 40 * fontScale,
        textAlign: 'center',
        margin: 10 * fontScale
    },
    h2: {
        fontSize: 32 * fontScale,
        textAlign: 'center',
        margin: 10 * fontScale
    },
    h3: {
        fontSize: 25 * fontScale,
        textAlign: 'center',
        margin: 10 * fontScale
    },
    screenTitle: {
        fontSize: 26 * fontScale,
        fontWeight: '500',
        textAlign: 'center',
        margin: 8 * fontScale
    },
    screenTitleSelected: {
        fontSize: 26 * fontScale,
        textAlign: 'center',
        margin: 8 * fontScale,
        color: selectionFontColor
    },
    modalTitle: {
        fontSize: 46 * fontScale,
        textAlign: 'center',
        margin: 8 * fontScale,
        color: 'white'
    },
    modalColumn: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12 * fontScale
    },
    modalTileLabel: modalTileLabel(false),
    modalTileLabelSelected: modalTileLabel(true),
    text: {
        fontSize: 17 * fontScale,
    },
    label: {
        fontSize: 28 * fontScale,
        padding: 10 * fontScale
    },
    textfield: {
        padding: 26 * fontScale * (isIos
            ? 1
            : 0.2),
        fontSize: 26 * fontScale,
        textAlign: 'center'
    },
    textfieldLeft: {
        fontSize: 26 * fontScale,
        height: (26 + 15) * fontScale,
        minWidth: 400 * fontScale,
        padding: 6 * fontScale,
        paddingLeft: 18 * fontScale,
        textAlign: 'left',
        backgroundColor: '#fff',
        borderRadius: 6,
        shadowRadius: 3,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 1,
            width: 0.3
        },
        margin: 3
    },
    dropdownButtonIos: {
        fontSize: 26 * fontScale,
        padding: 10 * fontScale,
        textAlign: 'center',
        borderColor: 'gray',
        borderWidth: 0
    },
    picker: {
        padding: 10 * fontScale,
        borderColor: 'gray',
        borderWidth: 0
    },
    button: {
        padding: 13 * fontScale,
        marginHorizontal: 13 * fontScale,
        marginVertical: 6 * fontScale,
        backgroundColor: selectionBackgroundColor
    },
    backButton: {
      width: 130*fontScale,
      height: 130*fontScale,
      borderRadius: 65*fontScale,
      padding: 13 * fontScale,
      marginHorizontal: 13 * fontScale,
      marginVertical: 100 * fontScale,
      backgroundColor: '#5bc0de'
    },
    addButton: {
      width: 60*fontScale,
      height: 60*fontScale,
      borderRadius: 30*fontScale,
      padding: 5 * fontScale,
      marginHorizontal: 20 * fontScale,
      marginVertical: 3 * fontScale,
      backgroundColor: 'orange'
    },
    centeredRowLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 6 * fontScale
    },
    centeredColumnLayout: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 6 * fontScale
    },
    form: {
        minHeight: 170 * fontScale,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: 10 * fontScale,
        borderRadius: 1 * fontScale,
        margin: 10 * fontScale,
        backgroundColor: '#fff',
        shadowRadius: 3,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 1,
            width: 0.3
        }
    },
    formRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 3 * fontScale
    },
    formRow500: {
        minWidth: 480 * fontScale,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 3 * fontScale
    },
    formElement: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 3 * fontScale
    },
    formLabel: {
        fontSize: 18 * fontScale,
        marginTop: 4.5 * fontScale,
        padding: 1.5 * fontScale,
        textAlign: 'right'
    },
    formField: {
        fontSize: 20 * fontScale,
        height: 20 * 2 * fontScale,
        padding: 3 * fontScale,
        paddingLeft: 6 * fontScale,
        flex: 100,
        textAlign: 'left',
        backgroundColor: 'white',
        borderRadius: 3,
        margin: 3,
        shadowRadius: 1,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 1,
            width: 0.3
        }
    },
    formValidationError: {
        fontSize: 20 * fontScale,
        color: 'red',
        position: 'absolute',
        bottom: 12 * fontScale,
        right: 12 * fontScale,
        textAlign: 'right',
        backgroundColor: '#ffffff99'
    },
    inputField: inputFieldStyle(false, false),
    inputFieldActive: inputFieldStyle(true, false),
    inputFieldActiveChanged: inputFieldStyle(true, true),
    formTableColumnHeader: {
        fontSize: 20 * fontScale,
        paddingHorizontal: 6 * fontScale,
        paddingVertical: 3 * fontScale,
        flex: 100,
        textAlign: 'center',
        borderRadius: 3,
        margin: 3,
    },
    formTableRowHeader: {
        fontSize: 20 * fontScale,
        paddingHorizontal: 6 * fontScale,
        paddingVertical: 3 * fontScale,
        flex: 50,
        textAlign: 'right',
        borderRadius: 3,
        margin: 3,
    },
    buttonsRowLayout: {
        flex: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5 * fontScale
    },
    buttonsRowStartLayout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    comboBox: {
        borderColor: 'gray',
        borderWidth: 1
    },
    card: cardStyle('white'),
    cardBooked: cardStyle('purple'),
    cardConfirmed: cardStyle('blue'),
    cardLate: cardStyle('red'),
    cardStarted: cardStyle('orange'),
    cardDone: cardStyle('green'),
    cardTitle: {
        fontSize: 18 * fontScale,
        fontWeight: '500',
        textAlign: 'center',
        margin: 10 * fontScale
    },
    cardColumn: {
        marginHorizontal: 1 * fontScale,
        alignItems: 'center'
    },
    popup: {
        padding: 20 * fontScale,
        borderRadius: 10 * fontScale,
        margin: 10 * fontScale,
        backgroundColor: 'white',
        shadowRadius: 4 * fontScale,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 10 * fontScale,
            width: 3 * fontScale
        }
    },
    popupTile: {
        padding: 20 * fontScale,
        margin: 10 * fontScale,
        backgroundColor: 'white',
        borderRadius: 10 * fontScale,
        shadowRadius: 4 * fontScale,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 10 * fontScale,
            width: 3 * fontScale
        }
    },
    popupTileSelected: {
        padding: 20 * fontScale,
        margin: 10 * fontScale,
        backgroundColor: 'white',
        borderRadius: 10 * fontScale,
        shadowRadius: 10 * fontScale,
        shadowColor: 'blue',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 3 * fontScale,
            width: 3 * fontScale
        }
    },
    popupNumberTile: {
        padding: 13 * fontScale,
        marginHorizontal: 5 * fontScale,
        minWidth: 150 * fontScale,
        marginVertical: 5 * fontScale,
        backgroundColor: 'white',
        borderRadius: 10 * fontScale,
        shadowRadius: 4 * fontScale,
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 10 * fontScale,
            width: 3 * fontScale
        }
    },
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5 * fontScale
    },
    tabFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5 * fontScale
    },
    tab: tabStyle(false),
    selectedTab: tabStyle(true),
    tabText: {
        fontSize: 18 * fontScale,
        flexWrap: 'nowrap'
    },
    tabTextSelected: {
        fontSize: 18 * fontScale,
        flexWrap: 'nowrap',
        color: 'orange',
        textShadowColor: 'orange',
        textShadowRadius: 0 * fontScale,
        textShadowOffset: {
        height: 0.3 * fontScale,
        width: 0.5 * fontScale
      }
    },
    tabCard: {
        padding: 10 * fontScale,
        minHeight: 200 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: 'white',
        borderWidth: 3,
        margin: 7 * fontScale,
        shadowRadius: 8,
        shadowColor: 'white',
        shadowOpacity: 1,
    },
    flow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center'
    },
    verticalFlow: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center'
    },
    todoExamCard: examCardStyle('red', false),
    todoExamCardExpanded: examCardStyle('blue', true),
    startedExamCard: examCardStyle('orange', false),
    startedExamCardExpanded: examCardStyle('orange', true),
    finishedExamCard: examCardStyle('green', false),
    finishedExamCardExpanded: examCardStyle('green', true),
    board: boardStyle('white'),
    boardTodo: boardStyle('#ffaabb'),
    store: {
        flex: 80,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30 * fontScale,
        borderColor: 'white',
        borderWidth: 3,
        margin: 7 * fontScale,
        shadowRadius: 8,
        shadowColor: 'white',
        shadowOpacity: 1,
    },
    room: {
        minWidth: 150 * fontScale,
        minHeight: 250 * fontScale,
        margin: 20 * fontScale,
        padding: 3 * fontScale,
        alignItems: 'center',
        backgroundColor: '#D7D7FF'
    },
    bottomRight: {
        position: 'absolute',
        bottom: 15 * fontScale,
        right: 20 * fontScale
    },
    listRow: {
        flex: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10 * fontScale,
        backgroundColor: 'white',
        margin: 3 * fontScale
    },
    listRowSelected: {
        flex: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10 * fontScale,
        backgroundColor: selectionColor,
        margin: 3 * fontScale
    },
    listTextSelected: {
        fontSize: 18 * fontScale,
        fontWeight: 'bold',
        flexWrap: 'nowrap',
        color: selectionFontColor,
    },
    scrollPopup: {
        position: 'absolute',
        top: 10 * fontScale,
        height: 140 * fontScale,
        left: 40,
        width: windowWidth-40*2,
        borderRadius: 4 * fontScale,
        backgroundColor: '#ffffffee',
        shadowRadius: 4 * fontScale,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 6 * fontScale,
            width: 3 * fontScale
        }
    },
    rulerIndicator: {
      width: 1*fontScale,
      height: 40 * fontScale,
      backgroundColor: 'red'
    }
});

function cardStyle(color: Color) {
  return {
      padding: 10 * fontScale,
      borderRadius: 3 * fontScale,
      margin: 10 * fontScale,
      backgroundColor: 'white',
      shadowRadius: 8 * fontScale,
      shadowColor: color,
      shadowOpacity: 0.3,
      shadowOffset: {
          height: 3 * fontScale,
          width: 1 * fontScale
      }
  }
}

function tabStyle(isSelected: boolean) {
    return {
        minWidth: 130 * fontScale,
        minHeight: 30 * fontScale,
        alignItems: 'center',
        paddingHorizontal: 14 * fontScale,
        paddingVertical: 6 * fontScale,
        borderRadius: 30 * fontScale,
        marginVertical: 10 * fontScale,
        marginHorizontal: 6 * fontScale,
        backgroundColor: isSelected?'white':'white',
        shadowRadius: isSelected ? 8 * fontScale : 3 * fontScale,
        shadowColor: isSelected ? 'orange' : 'green',
        shadowOpacity: 0.9,
        shadowOffset: {
            height: isSelected ? 0.5 : 1,
            width: isSelected ? 0.3 : 0.5
        }
    };
}

function boardStyle(shadowColor: Color) {
    return {
        padding: 10 * fontScale,
        minWidth: 330 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: shadowColor,
        borderWidth: 3 * fontScale,
        margin: 7 * fontScale,
        shadowRadius: 3 * fontScale,
        shadowColor: shadowColor,
        shadowOpacity: 0.9,
        shadowOffset: {
            height: 0.3,
            width: 0.3
        }
    }
}

function examCardStyle(shadowColor: Color, isExpanded: boolean) {
    return {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10 * fontScale,
        minWidth: (isExpanded ? 260 : 120) * fontScale,
        minHeight: 120 * fontScale,
        borderRadius: 10,
        margin: 10,
        backgroundColor: 'white',
        shadowRadius: 5,
        shadowColor: shadowColor,
        shadowOpacity: 0.6,
        shadowOffset: {
            height: 1,
            width: 0.3
        }
    };
}

function inputFieldStyle(isActive: boolean, hasNewValue: boolean) {
    return {
        fontSize: 20 * fontScale,
        minHeight: 32 * fontScale,
        flex: 100,
        paddingHorizontal: 6 * fontScale,
        paddingVertical: 3 * fontScale,
        textAlign: 'right',
        color: hasNewValue ? 'blue' : 'black',
        backgroundColor: isActive ? '#f0f0ff' : 'white',
        borderRadius: 3 * fontScale,
        margin: 3 * fontScale,
        borderWidth: 1 * fontScale,
        borderColor: isActive ? 'blue' : 'black',
        shadowRadius: 3,
        shadowColor: isActive ? 'blue' : 'black',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 1,
            width: 0.3
        }
    }
}

function modalTileLabel(isSelected: boolean) {
    return {
        fontSize: 26 * fontScale,
        textAlign: 'center',
        margin: 8 * fontScale,
        color: isSelected?selectionFontColor:fontColor,
        fontWeight: isSelected?'bold':'normal'
    }
}
