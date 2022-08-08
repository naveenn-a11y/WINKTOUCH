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
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"eventDetected"];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
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

@end
