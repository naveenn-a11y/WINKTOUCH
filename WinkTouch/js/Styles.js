import { StyleSheet, Dimensions, Platform, UIManager } from 'react-native';

export const windowWidth : number = Dimensions.get('window').width<Dimensions.get('window').height?Dimensions.get('window').height:Dimensions.get('window').width;
export const windowHeight : number = Dimensions.get('window').height<Dimensions.get('window').width?Dimensions.get('window').height:Dimensions.get('window').width;

export const fontScale = 0.75 * Math.min(1, Math.min(windowWidth / 1024, windowHeight / 768));
__DEV__ && console.log('Device resolution: '+windowWidth+'x'+windowHeight+' -> scale='+fontScale);

export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

if (isAndroid) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const backgroundColor = 'white';
export const sectionBackgroundColor = '#f2f2f2'
export const fontColor = undefined;
export const selectionColor = '#5ed4d4';
export const selectionFontColor : string = '#1db3b3';
export const selectionBorderColor = '#1db3b3';
export const selectionBackgroundColor = '#c9ffff'

const fieldMinWidth = 100;

const tile = {
    height: 70 * fontScale,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5 * fontScale,
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
    },
    borderWidth: 2 * fontScale,
    borderColor: backgroundColor
  };

const flow = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start'
};

export const styles = StyleSheet.create({
    screeen: {
        flex: 100,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: backgroundColor,
    },
    centeredScreenLayout: {
        flex: 100,
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundColor: backgroundColor
    },
    page: {
        flex: 100,
        flexDirection: 'column',
        backgroundColor: backgroundColor,
    },
    paragraph: {
        flex: 100,
        flexDirection: 'column',
        marginHorizontal: 10 * fontScale,
    },
    paragraphBorder: {
        flex: 100,
        flexDirection: 'column',
        marginHorizontal: 10 * fontScale,
    },
    sideMenu: {
        padding: 10 * fontScale,
        width: 180 * fontScale,
        backgroundColor: '#1db3b3',
        shadowColor: 'gray',
        shadowOpacity: 0.7,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    sideMenuList: {
      padding: 6 * fontScale,
      maxWidth: 160 * fontScale,
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
        fontSize: 30 * fontScale,
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
        margin: 12 * fontScale,
        marginTop: 30 * fontScale,
    },
    screenTitleSelected: {
        fontSize: 26 * fontScale,
        textAlign: 'center',
        margin: 8 * fontScale,
        color: selectionFontColor
    },
    sectionTitle: {
        fontSize: 24 * fontScale,
        color: selectionFontColor,
        fontWeight: '500',
        textAlign: 'center',
        margin: 6 * fontScale
    },
    modalTitle: {
        fontSize: 46 * fontScale,
        textAlign: 'center',
        margin: 10 * fontScale,
        color: 'white'
    },
    modalColumn: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginHorizontal: 9 * fontScale,
        marginBottom: 10 * fontScale, //Weird for scroll list
        borderRightWidth: 3 * fontScale,
        borderColor: 'white',
        paddingRight: 10 * fontScale
    },
    modalKeypadColumn: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginHorizontal: 1 * fontScale,
        marginBottom: 10 * fontScale, //Weird for scroll list
    },
    modalTileLabel: modalTileLabel(false),
    modalTileLabelSelected: modalTileLabel(true),
    modalTileIcon: modalTileLabel(false, true),
    text: {
        fontSize: 18 * fontScale,
    },
    textLeft: {
      fontSize: 18 * fontScale,
      textAlign: 'left'
    },
    label: {
        fontSize: 28 * fontScale,
        padding: 10 * fontScale
    },
    checkButtonLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0 * fontScale
    },
    checkButtonLabel: {
      fontSize: 18 * fontScale,
      textAlign: 'center',
      color: fontColor
    },
    checkButtonIcon: {
        fontSize: 36 * fontScale,
        textAlign: 'center',
        marginHorizontal: 5 * fontScale,
    },
    instructionText: {
        fontSize: 24 * fontScale,
        padding: 10 * fontScale,
    },
    textfield: {
        padding: 26 * fontScale * (isIos
            ? 1
            : 0.2),
        fontSize: 26 * fontScale,
        textAlign: 'center',
        borderRadius: 6 * fontScale,
        shadowRadius: 3 * fontScale,
    },
    searchField: {
        fontSize: 26 * fontScale,
        height: (26 + 15) * fontScale,
        minWidth: 200 * fontScale,
        padding: 6 * fontScale,
        paddingLeft: 18 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 1 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#dddddd',
    },
    field400: {
        fontSize: 26 * fontScale,
        height: (26 + 15) * fontScale,
        minWidth: 400 * fontScale,
        padding: 6 * fontScale,
        paddingLeft: 18 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 1 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#dddddd',
        margin: 3 *fontScale
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
        padding: 16 * fontScale,
        marginHorizontal: 13 * fontScale,
        marginVertical: 6 * fontScale,
        backgroundColor: '#1db3b3',
        borderRadius: 30 * fontScale
    },
    buttonText: {
        fontSize: 20 * fontScale,
        backgroundColor: '#1db3b3',
        color: 'white',
    },
    fabButtonText: {
        fontSize: 20 * fontScale,
        color: 'white',
    },
    linkButton: {
       color: selectionFontColor,
       textAlign: 'center',
       padding: 10 * fontScale,
       fontSize: 22 * fontScale,
    },
    backButton: {
      width: 130*fontScale,
      height: 100*fontScale,
      borderRadius: 65*fontScale,
      marginVertical: 20 * fontScale,
      alignSelf: 'center',
      backgroundColor: '#2dc3c3'
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
    rowLayout: {
        flexDirection: 'row'
    },
    flexRow: {
      flex:100,
      flexDirection: 'row'
    },
    fieldContainer: {
        flexDirection: 'row',
        minWidth: fieldMinWidth * fontScale,
    },
    fieldFlexContainer: {
        flex: 100,
        flexDirection: 'row'
    },
    fieldFlexContainer2: {
        flex: 200,
        flexDirection: 'row',
    },
    flexColumnLayout: {
        flex: 100,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    centeredRowLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0 * fontScale
    },
    columnLayout: {
        flex: 0,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    centeredColumnLayout: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0 * fontScale
    },
    examPreview: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start'
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
        width: 520 * fontScale,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 3 * fontScale
    },
    formRowL: {
        width: 680 * fontScale,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 3 * fontScale
    },
    formRow1000: {
        width: 1040 * fontScale,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 3 * fontScale
    },
    formElement: {
        flex: 100,
        flexDirection: 'row',
        alignItems: 'center',
    },
    formElement2: {
        flex: 200,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 3 * fontScale
    },
    formLabel: {
        fontSize: 18 * fontScale,
        padding: 3 * fontScale
    },
    formPrefix: {
        fontSize: 18 * fontScale,
        marginTop: 4.5 * fontScale,
        padding: 1.5 * fontScale,
        textAlign: 'right'
    },
    formSuffix: {
        fontSize: 18 * fontScale,
        marginTop: 6.5 * fontScale,
        padding: 1.5 * fontScale,
        textAlign: 'left'
    },
    formField: {
        flex: 100,
        fontSize: 20 * fontScale,
        height: 36 * fontScale,
        paddingTop: 6 * fontScale,
        paddingBottom: 4 * fontScale,
        paddingLeft: 6 * fontScale,
        paddingRight: 3 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 1 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#dddddd',
        margin: 3 * fontScale
    },
    formFieldError: {
        flex: 100,
        fontSize: 20 * fontScale,
        height: 36 * fontScale,
        paddingTop: 6 * fontScale,
        paddingBottom: 4 * fontScale,
        paddingLeft: 6 * fontScale,
        paddingRight: 3 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 2 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#ff0000',
        margin: 3 * fontScale
    },
    formFieldReadOnly: {
        flex: 100,
        color: '#aaaaaa',
        fontSize: 20 * fontScale,
        height: 36 * fontScale,
        paddingTop: 6 * fontScale,
        paddingBottom: 4 * fontScale,
        paddingLeft: 6 * fontScale,
        paddingRight: 3 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 1 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#eeeeee',
        margin: 3 * fontScale
    },
    formFieldLines: {
        flex: 100,
        fontSize: 20 * fontScale,
        height: 36 * 4.7 * fontScale,
        paddingTop: 6 * fontScale,
        paddingBottom: 4 * fontScale,
        paddingLeft: 6 * fontScale,
        paddingRight: 3 * fontScale,
        textAlign: 'left',
        backgroundColor: 'white',
        borderWidth: 1 * fontScale,
        borderRadius: 6 * fontScale,
        borderColor: '#dddddd',
        margin: 3 * fontScale
    },
    formValidationError: {
        fontSize: 20 * fontScale,
        color: 'red',
        position: 'absolute',
        bottom: 7 * fontScale,
        right: 7 * fontScale,
        textAlign: 'right',
        backgroundColor: '#ffffffcc'
    },
    inputField: inputFieldStyle(false, false),
    inputFieldActive: inputFieldStyle(true, false),
    inputFieldActiveChanged: inputFieldStyle(true, true),
    formTableRowHeader: {
        flex: 65,
        fontSize: 20 * fontScale,
        paddingHorizontal: 3 * fontScale,
        textAlign: 'right',
        margin: 4 * fontScale,
    },
    formTableColumnHeader: {
        flex: 100,
        flexDirection: 'row',
        fontSize: 20 * fontScale,
        textAlign: 'center',
        margin: 4 * fontScale,
        marginTop: 20 * fontScale,
        marginBottom: 0 * fontScale
    },
    formTableColumnHeaderWide: {
        flex: 240,
        flexDirection: 'row',
        fontSize: 20 * fontScale,
        textAlign: 'center',
        margin: 4 * fontScale,
        marginTop: 20 * fontScale,
        marginBottom: 0 * fontScale
    },
    formTableColumnHeaderSmall: {
        width:30*fontScale
    },
    formTableColumnHeaderFlat: {
        width:0*fontScale
    },
    buttonsRowLayout: {
        flex: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    card0: cardStyle('purple'),
    card1: cardStyle('blue'),
    card2: cardStyle('gray'),
    card3: cardStyle('red'),
    card4: cardStyle('yellow'),
    card5: cardStyle('green'),
    cardTitle: {
        fontSize: 21 * fontScale,
        fontWeight: '500',
        textAlign: 'center',
        margin: 10 * fontScale
    },
    cardTitleLeft: {
        fontSize: 21 * fontScale,
        fontWeight: '500',
        textAlign: 'left',
        margin: 0 * fontScale
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
    popupBackground: {
      flex: 100,
      backgroundColor: '#00000077',
      padding:20 * fontScale,
      paddingBottom: 20 *fontScale
    },
    popupTile: {
        ...tile
    },
    popupTileSelected: {
        ...tile,
        backgroundColor: selectionBackgroundColor,
        borderColor: selectionBorderColor
    },
    nextTile: {
        position: 'absolute',
        bottom: 0 * fontScale,
        right: 8 * fontScale,
        ...tile
    },
    previousTile: {
        position: 'absolute',
        bottom: 0 * fontScale,
        left: 8 * fontScale,
        ...tile
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
        flexWrap: 'nowrap',
        color: selectionFontColor,
        textShadowColor: selectionColor,
        textShadowRadius: 0 * fontScale,
        textShadowOffset: {
          height: 0.3 * fontScale,
          width: 0.5 * fontScale
        }
    },
    tabTextSelected: {
        fontSize: 18 * fontScale,
        color: 'white',
        flexWrap: 'nowrap'
    },
    tabCard: {
        flexGrow: 100,
        padding: 10 * fontScale,
        paddingBottom: 40 * fontScale,
        minHeight: 260 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: selectionFontColor,
        borderWidth: 2*fontScale,
        margin: 7 * fontScale,
    },
    tabCardS: {
        flexGrow: 100,
        padding: 20 * fontScale,
        minHeight: 100 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: selectionFontColor,
        borderWidth: 2*fontScale,
        margin: 7 * fontScale,
    },
    errorCard: {
        flexGrow: 0,
        padding: 15 * fontScale,
        paddingLeft: 50 * fontScale,
        minHeight: 40 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: 'red',
        borderWidth: 3 * fontScale,
        margin: 7 * fontScale,
    },
    buttonsCard: {
        padding: 10 * fontScale,
        paddingBottom: 40 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: selectionFontColor,
        borderWidth: 2*fontScale,
        margin: 7 * fontScale,
    },
    examsBoard: {
        backgroundColor: sectionBackgroundColor,
        flexGrow: 100,
        minWidth: 150 * fontScale,
        minHeight: 185 * fontScale,
        padding: 10 * fontScale,
        paddingLeft: 50 * fontScale,
        borderRadius: 30 * fontScale,
        borderColor: selectionFontColor,
        borderWidth: 2*fontScale,
        margin: 7 * fontScale,
    },
    startVisitCard: {
      backgroundColor: sectionBackgroundColor,
      flexGrow: 100,
      padding: 10 * fontScale,
      paddingBottom: 40 * fontScale,
      minHeight: 160 * fontScale,
      borderRadius: 30 * fontScale,
      borderColor: selectionFontColor,
      borderWidth: 2*fontScale,
      margin: 7 * fontScale,
    },
    flow: flow,
    flowLeft: {
      justifyContent: 'flex-start',
      ...flow
    },
    flowLeft1: {
      justifyContent: 'flex-start',
      flex: 100,
      ...flow
    },
    flow1: {
        flex: 100,
        ...flow
    },
    flow2: {
        flex: 200,
        ...flow
    },
    flow3: {
        flex: 300,
        ...flow
    },
    topFlow: {
      ...flow,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    verticalFlow: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
    },
    examCard: examCardStyle('gray'),
    todoExamCard: examCardStyle('orange'),
    finishedExamCard: examCardStyle('green'),
    board: boardStyle('#dddddd'),
    boardSelected: boardStyle(selectionBorderColor),
    boardS: boardStyle('#dddddd','S'),
    boardM: boardStyle('#dddddd','M'),
    boardL: boardStyle('#dddddd','L'),
    boardXL: boardStyle('#dddddd','XL'),
    boardTodo: boardStyle('#ffaabb'),
    boardTodoS: boardStyle('#ffaabb','S'),
    boardTodoM: boardStyle('#ffaabb','M'),
    boardTodoL: boardStyle('#ffaabb','L'),
    boardTodoL: boardStyle('#ffaabb','XL'),
    historyBoard: boardStyle(backgroundColor,'L', 278),
    historyBoardSelected: boardStyle(selectionBorderColor,'L', 278),
    boardStretch: {
      width: 530*fontScale,
      height: 285 * fontScale,
      padding: 10 * fontScale,
      borderRadius: 30 * fontScale,
      borderColor: '#dddddd',
      borderWidth: 3 * fontScale,
      margin: 7 * fontScale,
      shadowRadius: 3 * fontScale,
      shadowColor: '#dddddd',
      shadowOpacity: 0.9,
      shadowOffset: {
          height: 0.3,
          width: 0.3
      }
    },
    boardStretchL: {
      flexShrink: 1,
      width: 1080*fontScale,
      height: 285 * fontScale,
      padding: 10 * fontScale,
      borderRadius: 30 * fontScale,
      borderColor: '#dddddd',
      borderWidth: 3 * fontScale,
      margin: 7 * fontScale,
      shadowRadius: 3 * fontScale,
      shadowColor: '#dddddd',
      shadowOpacity: 0.9,
      shadowOffset: {
          height: 0.3,
          width: 0.3
      }
    },
    wrapBoard: {
      flex: 0,
      flexDirection: 'column',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      maxHeight: 245 * fontScale,
      padding: 5 * fontScale,
      margin: 0 * fontScale
    },
    wideFavorites: {
      flexShrink: 1,
      width: 1080*fontScale,
      height: 145 * fontScale,
      padding: 10 * fontScale,
      borderRadius: 30 * fontScale,
      borderColor: '#dddddd',
      borderWidth: 3 * fontScale,
      margin: 7 * fontScale,
      shadowRadius: 3 * fontScale,
      shadowColor: '#dddddd',
      shadowOpacity: 0.9,
      shadowOffset: {
          height: 0.3,
          width: 0.3
      }
    },
    store: {
        flex: 80,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30 * fontScale,
        borderColor: 'white',
        borderWidth: 3 * fontScale,
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
        right: 8 * fontScale
    },
    listRow: {
        flex: 10,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 10 * fontScale,
        backgroundColor: 'white',
        margin: 3 * fontScale
    },
    listRowSelected: {
        flex: 10,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 10 * fontScale,
        backgroundColor: selectionColor,
        margin: 3 * fontScale
    },
    listText: {
        fontSize: 18 * fontScale,
        flexWrap: 'nowrap',
        textAlign: 'left',
    },
    listTextSelected: {
        fontSize: 18 * fontScale,
        fontWeight: 'bold',
        flexWrap: 'nowrap',
        textAlign: 'left',
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
    },
    solidWhite: {
      backgroundColor: 'white'
    },
    flag: {
      position: 'absolute',
      top:0 * fontScale,
      right:  15 * fontScale,
      backgroundColor: '#00000000'
    },
    flagFont: {
      fontSize: 30 * fontScale,
      padding:20 * fontScale
    },
    version: {
      position: 'absolute',
      bottom:20 * fontScale,
      right:  20 * fontScale,
      fontSize: 14 * fontScale
    },
    versionFont: {
      fontSize: 14 * fontScale
    },
    screenIcon: {
      padding: 20 * fontScale,
      fontSize: 30 * fontScale
    },
    groupIcon: {
      padding: 15 * fontScale,
      fontSize: 25 * fontScale
    },
    voiceIconMulti: {
      padding: 25 * fontScale,
      paddingVertical: 40 * fontScale,
      fontSize: 45 * fontScale,
      margin: -20 * fontScale,
    },
    voiceIcon: {
      padding: 25 * fontScale,
      paddingVertical: 20 * fontScale,
      fontSize: 45 * fontScale,
      margin: -20 * fontScale,
    },
    textIcon: {
      padding: 0 * fontScale,
      fontSize: 25 * fontScale
    },
    examIcons: {
      position: 'absolute',
      top:0 * fontScale,
      right:  18 * fontScale,
      flexDirection: 'row'
    },
    groupIcons: {
      position: 'absolute',
      top:0 * fontScale,
      right:  15 * fontScale,
      flexDirection: 'row'
    },
    separator: {
      marginTop: 10*fontScale
    },
    popupFullScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    scanner: {
      width: 600 * fontScale,
      height: 800 * fontScale,
      borderColor: 'orange',
      borderWidth: 1
    },
    bigImage: {
      width: 1000 * fontScale,
      height: 750 * fontScale
    },
    floatingContainer: {
      position: 'absolute',
      bottom: 0 * fontScale,
      right: 0 * fontScale,
      width:210*fontScale
    },
    floatingButton: {
      position: 'absolute',
      bottom: 0 * fontScale,
      right: 0 * fontScale,
      backgroundColor: 'orange'
    },
    floatingSubButton: {
      flex:1,
      width: null,
      shadowOpacity: 0.3,
      shadowOffset: {
          height: 6 * fontScale,
          width: 2 * fontScale
      },
      backgroundColor: 'orange'
    },
    bottomEndOfRow: {
      position: 'absolute',
      bottom: 0 * fontScale,
      right: 0 * fontScale
    },
    copyRow: {
      position: 'absolute',
      bottom: -20 * fontScale,
      right: -5 * fontScale,
      fontSize: 28 * fontScale,
      fontWeight: 'normal',
      padding: 5*fontScale,
      transform: [{rotate: '90deg'}]
    },
    copyColumn: {
      position: 'absolute',
      left: -25 * fontScale,
      top: -12 * fontScale,
      fontSize: 28 * fontScale,
      fontWeight: 'normal',
      borderWidth: 0,
      padding: 8*fontScale,
      paddingHorizontal: 15 * fontScale
    },
    patientDocument: {
      flex:1,
      height: 1000*fontScale,
      margin: 10 * fontScale,
      marginRight: 15 * fontScale,
      backgroundColor: sectionBackgroundColor
    },
    assessmentCard: {
      padding: 10 * fontScale,
      borderRadius: 3 * fontScale,
      margin: 10 * fontScale,
      backgroundColor: sectionBackgroundColor,
      shadowRadius: 8 * fontScale,
      shadowColor: selectionColor,
      shadowOpacity: 0.3,
      shadowOffset: {
          height: 3 * fontScale,
          width: 1 * fontScale
      }
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
        height: 58 * fontScale,
        alignItems: 'center',
        paddingHorizontal: 14 * fontScale,
        paddingVertical: 6 * fontScale,
        borderRadius: 3 * fontScale,
        marginTop: 14 * fontScale,
        marginBottom: 8 * fontScale,
        marginLeft: 12 * fontScale,
        marginRight: 4 * fontScale,
        backgroundColor: !isSelected?'white':selectionColor,
        shadowRadius: !isSelected ? 3 * fontScale : 3 * fontScale,
        shadowColor: !isSelected ? selectionColor : 'gray',
        shadowOpacity: 0.9,
        shadowOffset: {
            height: !isSelected ? 0.5 : 1,
            width: !isSelected ? 0.3 : 0.5
        }
    };
}

function boardStyle(shadowColor: Color, size: ?string = 'S', minHeight: ?number = 0) {
    const minWidth : number = size === 'XL'?1040:size==='L'?680:size==='M'?520:size==='S'?340:340;
    return {
        flex: 0,
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        padding: 10 * fontScale,
        paddingTop: (size==='S'?36:10) * fontScale,
        minWidth: minWidth * fontScale,
        minHeight: minHeight *fontScale,
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

export function imageStyle(size: string, aspecRatio: number) {
  const width : number = size === 'XL'?1110:size==='L'?680:size==='M'?520:size==='S'?340:340;
  return {
    width: width*fontScale,
    height: width*fontScale/aspecRatio,
    resizeMode: 'contain'
  }

}

function examCardStyle(shadowColor: Color) {
    return {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 14 * fontScale,
        paddingBottom: 8 * fontScale,
        minWidth: 130 * fontScale,
        minHeight: 130 * fontScale,
        borderRadius: 10,
        margin: 10,
        backgroundColor: 'white',
        shadowRadius: 6 * fontScale,
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
        shadowRadius: 3 * fontScale,
        shadowColor: isActive ? 'blue' : 'black',
        shadowOpacity: 0.3,
        shadowOffset: {
            height: 1,
            width: 0.3
        }
    }
}

function modalTileLabel(isSelected: boolean, isIcon?: boolean = false) {
    return {
        fontSize: (isIcon?36:26) * fontScale,
        textAlign: 'center',
        margin: (isIcon?5:8) * fontScale,
        color: isSelected?selectionFontColor:fontColor,
        fontWeight: isSelected?'bold':'normal'
    }
}

export function scaleStyle(style: Object) : Object {
  if (style===undefined || style===null) return style;
  const scaledStyle : Object = JSON.parse(JSON.stringify(style));;
  if (style.top) scaledStyle.top = style.top * fontScale;
  if (style.left) scaledStyle.left = style.left * fontScale;
  if (style.right) scaledStyle.right = style.right * fontScale;
  if (style.bottom) scaledStyle.bottom = style.bottom * fontScale;
  if (style.width) scaledStyle.width = style.width * fontScale;
  if (style.height) scaledStyle.height = style.height * fontScale;
  if (style.top) scaledStyle.top = style.top * fontScale;



  return scaledStyle;
}
