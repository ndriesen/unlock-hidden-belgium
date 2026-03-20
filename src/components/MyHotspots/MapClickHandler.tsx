"use client";

import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LatLngTuple } from 'leaflet';

type MapClickHandlerProps = {
  onClick: (e: L.LeafletMouseEvent) => void;
};

export default function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({
    click: onClick,
  });
  return null;
}
