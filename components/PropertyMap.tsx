import { router } from 'expo-router';
import { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { priceText } from '@/components/PropertyCard';
import { C } from '@/constants/theme';
import { Property } from '@/data/properties';
import { regionFor } from '@/lib/geo';

type Props = {
  properties: Property[];
  style?: StyleProp<ViewStyle>;
  /** true = peta kecil statis untuk satu properti */
  single?: boolean;
};

export function PropertyMap({ properties, style, single }: Props) {
  const pts = properties.filter((p) => p.lat !== undefined && p.lng !== undefined);
  return (
    <MapView
      style={style}
      initialRegion={regionFor(pts)}
      scrollEnabled={!single}
      zoomEnabled={!single}
      pitchEnabled={false}
      rotateEnabled={false}
      showsUserLocation={!single}>
      {pts.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat!, longitude: p.lng! }}
          pinColor={C.primary}
          title={single ? undefined : priceText(p)}
          description={single ? undefined : `${p.title} · ketuk untuk detail`}
          onCalloutPress={() => router.push(`/property/${p.id}`)}
        />
      ))}
    </MapView>
  );
}
