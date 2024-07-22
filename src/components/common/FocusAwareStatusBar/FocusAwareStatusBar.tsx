import React from 'react';
import {StatusBar, StatusBarProps} from 'react-native';
import {useIsFocused} from '@react-navigation/native';

/**
 * A StatusBar component that is aware of the focus state of the screen.
 * It will only show the StatusBar if the screen is focused.
 *
 * @param props StatusBarProps
 *
 * @returns React.ReactElement
 *
 *  @example
 * ```tsx
 * <FocusAwareStatusBar barStyle="dark-content" backgroundColor="#003CBF" />
 * ```
 *
 * @beta
 *
 * @see https://reactnavigation.org/docs/use-is-focused/
 * @see https://reactnative.dev/docs/statusbar
 **/
function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();

  return isFocused ? <StatusBar {...props} /> : null;
}

export default FocusAwareStatusBar;
