import React from 'react';
import {Svg, Rect, Text, TSpan} from 'react-native-svg';

interface TicketTextSVGProps {
  ticketText: string;
  width?: number;
  padding?: number;
  lineHeight?: number;
  fontSize?: number;
}

const TicketSVG: React.FC<TicketTextSVGProps> = ({
  ticketText,
  width = 800,
  padding = 20,
  lineHeight = 22,
  fontSize = 16,
}) => {
  // Separamos el texto en líneas y removemos espacios en blanco extra
  const lines = ticketText
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Calculamos la altura total del SVG según la cantidad de líneas
  const height = padding * 2 + lineHeight * lines.length;

  return (
    <Svg width={width} height={height}>
      <Rect x="0" y="0" width={width} height={height} fill="white" />
      <Text x={padding} y={padding} fontSize={fontSize} fill="black">
        {lines.map((line, index) => (
          <TSpan
            key={index}
            x={padding.toString()}
            dy={index === 0 ? '0' : lineHeight.toString()}>
            {line}
          </TSpan>
        ))}
      </Text>
    </Svg>
  );
};

export default TicketSVG;
