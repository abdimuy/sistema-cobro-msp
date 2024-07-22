import {View, Text} from 'react-native';
import React from 'react';

const ProgressBar = (props: {
  backgroundColor: string;
  backgroudColorFilled: string;
  value: number;
  height: number;
  width: number | '100%';
  borderRadius?: number;
}) => {
  return (
    <View
      style={{
        backgroundColor: props.backgroundColor,
        height: props.height,
        width: props.width,
        borderRadius: props.borderRadius,
      }}>
      <View
        style={{
          backgroundColor: props.backgroudColorFilled,
          height: props.height,
          width: `${props.value}%`,
          borderRadius: props.borderRadius,
        }}
      />
    </View>
  );
};

export default ProgressBar;
