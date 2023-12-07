//
//  RCTEventTrackerModule.h
//  WinkTouch
//
//  Created by Femi Oluwaniran on 09/05/2022.
//

//  RCTEventTrackerModule.h
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCTEventTrackerModule : RCTEventEmitter <RCTBridgeModule>

+ (id)allocWithZone:(NSZone *)zone;

- (void)dispatchEvent;

- (void) setKeyCommandsWithJSON:(id)json;

- (NSArray<UIKeyCommand *> *) getKeyCommands;

- (void)sendKeyCommandEvent:(UIKeyCommand *)keyCommand;

@end
