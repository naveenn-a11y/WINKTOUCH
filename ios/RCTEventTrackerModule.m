//
//  RCTEventTrackerModule.m
//  WinkTouch
//
//  Created by Femi Oluwaniran on 09/05/2022.
//

#import <Foundation/Foundation.h>
#import "RCTEventTrackerModule.h"


@implementation RCTEventTrackerModule
{
  bool hasListeners;
  NSArray<UIKeyCommand *> *currentKeyCommands;
}

-(instancetype) init {
    self = [super init];
    if (self) {
        currentKeyCommands = @[];
    }
    return self;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"eventDetected", @"onKeyUp"];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

+ (id)allocWithZone:(NSZone *)zone {
    static RCTEventTrackerModule *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [super allocWithZone:zone];
    });
    return sharedInstance;
}

+ (id)getSingletonInstance {
    static RCTEventTrackerModule *sharedRCTEventTrackerModule = nil;
    if (sharedRCTEventTrackerModule == nil) {
      sharedRCTEventTrackerModule = [[self alloc] init];
    }
    return sharedRCTEventTrackerModule;
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (void)dispatchEvent
{
  if (hasListeners && self.bridge) {
    [self sendEventWithName:@"eventDetected" body:@{@"name": @"touch"}];
  }
}

- (void)sendKeyCommandEvent:(UIKeyCommand *)keyCommand {
  if (hasListeners && self.bridge) {
    [super sendEventWithName:@"onKeyUp" body:@{
      @"input": keyCommand.input,
      @"modifierFlags": [NSNumber numberWithInteger:keyCommand.modifierFlags],
      @"discoverabilityTitle": keyCommand.discoverabilityTitle ? keyCommand.discoverabilityTitle : [NSNull null]
    }];
  }
}

- (NSDictionary *)constantsToExport {
  return @{
    @"keyModifierAlphaShift": @(UIKeyModifierAlphaShift),
    @"keyModifierControl": @(UIKeyModifierControl),
    @"keyModifierAlternate": @(UIKeyModifierAlternate),
    @"keyModifierCommand": @(UIKeyModifierCommand),
    @"keyModifierNumericPad": @(UIKeyModifierNumericPad),
    @"keyModifierShift": @(UIKeyModifierShift),
    @"keyInputUpArrow": UIKeyInputUpArrow,
    @"keyInputDownArrow": UIKeyInputDownArrow,
    @"keyInputLeftArrow": UIKeyInputLeftArrow,
    @"keyInputRightArrow": UIKeyInputRightArrow,
    @"keyInputEscape": UIKeyInputEscape
  };
}

- (NSArray<UIKeyCommand *> *) getKeyCommands {
  return currentKeyCommands;
}

RCT_EXPORT_METHOD(setKeyCommandsWithJSON: (id)json){
    if (!json) {
        currentKeyCommands = @[];
    }
    NSArray<NSDictionary *> *commandsArray = json;
    NSMutableArray<UIKeyCommand *> *keyCommands = [NSMutableArray array];
    for (NSDictionary *commandJSON in commandsArray) {
        NSString *input = commandJSON[@"input"];
        NSNumber *flags = commandJSON[@"modifierFlags"];
        NSString *discoverabilityTitle = commandJSON[@"discoverabilityTitle"];
        if (!flags) {
            flags = @0;
        }
        UIKeyCommand *command;
        if (discoverabilityTitle) {
            command = [UIKeyCommand keyCommandWithInput:input
                                          modifierFlags:[flags integerValue]
                                                 action:@selector(keyInput:)
                                   discoverabilityTitle:discoverabilityTitle];
        } else {
            command = [UIKeyCommand keyCommandWithInput:input
                                          modifierFlags:[flags integerValue]
                                                 action:@selector(keyInput:)];
        }
        [keyCommands addObject:command];
    }
    currentKeyCommands = keyCommands;
}

@end