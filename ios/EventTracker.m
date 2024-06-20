//
//  EventTracker.m
//  WinkTouch
//
//  Created by Femi Oluwaniran on 09/05/2022.
//

#import "EventTracker.h"
#import "AppDelegate.h"
#import "RCTEventTrackerModule.h"


@implementation EventTracker

RCTEventTrackerModule *rctEventTrackerModule = nil;

- (void)sendEvent:(UIEvent *)event
{
  [super sendEvent:event];
  if (rctEventTrackerModule == nil) {
    rctEventTrackerModule = [[RCTEventTrackerModule alloc] init];
  }
  
  NSSet *touches = [event allTouches];
  UITouch *touch = [touches anyObject];
  if (touch.phase == UITouchPhaseEnded) {
    [rctEventTrackerModule dispatchEvent];
  }
}

- (NSArray<UIKeyCommand *> *)keyCommands {
  if (rctEventTrackerModule == nil) {
    rctEventTrackerModule = [[RCTEventTrackerModule alloc] init];
  }
  return [rctEventTrackerModule getKeyCommands];
}


- (void)keyInput:(UIKeyCommand *)sender {
  [rctEventTrackerModule sendKeyCommandEvent:sender];
}


@end