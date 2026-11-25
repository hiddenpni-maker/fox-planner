import React, { useContext } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { FoxStoreContext } from '../store/FoxStoreContext';
import { buildScaledTextStyle } from '../theme/typography';

/** Global themed Text component applying the chosen Persian font family and responsive font scale. */
export function Text({ style, ...rest }: TextProps) {
  const store = useContext(FoxStoreContext);
  const fontPreset = store?.state.fontFamilyPreset ?? 'vazirmatn';
  const scalePreset = store?.state.fontScalePreset ?? 'md';
  const fontsReady = store?.fontsReady ?? false;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolved = buildScaledTextStyle(flat ?? {}, fontPreset, scalePreset, fontsReady);

  return <RNText {...rest} style={resolved} />;
}

/** Global themed TextInput component matching user font family and font size multiplier. */
export function TextInput({ style, ...rest }: TextInputProps) {
  const store = useContext(FoxStoreContext);
  const fontPreset = store?.state.fontFamilyPreset ?? 'vazirmatn';
  const scalePreset = store?.state.fontScalePreset ?? 'md';
  const fontsReady = store?.fontsReady ?? false;

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const resolved = buildScaledTextStyle(flat ?? {}, fontPreset, scalePreset, fontsReady);

  return <RNTextInput {...rest} style={resolved} />;
}
