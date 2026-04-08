"use client";

import dynamic from 'next/dynamic';

const NewTripsPage = dynamic(() => import('@/components/newTrips/NewTripsPage'), { ssr: false });

export default function NewTrips() {
  return <NewTripsPage />;
}

