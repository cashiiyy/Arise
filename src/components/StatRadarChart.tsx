import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { SystemText } from './SystemText';
import { COLORS } from '../theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface StatRadarChartProps {
  data: { label: string; value: number }[]; // value 0 to 100
  size?: number;
  onStatPress?: (label: string) => void;
}

export const StatRadarChart: React.FC<StatRadarChartProps> = ({ data, size = 300, onStatPress }) => {
  const center = size / 2;
  const radius = (size / 2) - 40;
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
  }, []);

  const getPointCoordinates = (value: number, index: number, total: number) => {
    'worklet';
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const animatedPolygonProps = useAnimatedProps(() => {
    const points = data.map((d, i) => {
      const coord = getPointCoordinates(d.value * animatedProgress.value, i, data.length);
      return `${coord.x},${coord.y}`;
    }).join(' ');
    
    return { points };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Outer Grid Polygon */}
        <Polygon
          points={data.map((_, i) => {
            const coord = getPointCoordinates(100, i, data.length);
            return `${coord.x},${coord.y}`;
          }).join(' ')}
          fill="none"
          stroke={COLORS.cardBorder}
          strokeWidth="1"
        />
        
        {/* Inner Grid Polygons (e.g., at 50% and 75%) */}
        {[50, 75].map(scale => (
          <Polygon
            key={`grid-${scale}`}
            points={data.map((_, i) => {
              const coord = getPointCoordinates(scale, i, data.length);
              return `${coord.x},${coord.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines */}
        {data.map((_, i) => {
          const coord = getPointCoordinates(100, i, data.length);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={coord.x}
              y2={coord.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Animated Value Polygon */}
        <AnimatedPolygon
          animatedProps={animatedPolygonProps}
          fill="rgba(0, 191, 255, 0.4)"
          stroke={COLORS.primary}
          strokeWidth="2"
        />

      </Svg>

      {/* Labels placed over the SVG using absolute positioning for touchability */}
      {data.map((d, i) => {
        const coord = getPointCoordinates(115, i, data.length);
        return (
          <TouchableOpacity
            key={`label-${d.label}`}
            style={[styles.labelContainer, { left: coord.x - 20, top: coord.y - 10 }]}
            onPress={() => onStatPress && onStatPress(d.label)}
          >
            <SystemText variant="mono" color={COLORS.primary} style={{ fontSize: 12, fontWeight: 'bold' }}>
              {d.label}
            </SystemText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    width: 40,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
