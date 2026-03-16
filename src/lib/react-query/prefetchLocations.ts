import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

export async function prefetchLocations(
  queryClient: QueryClient,
  bbox: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.locationsBbox(bbox),
    queryFn: () =>
      fetch(`/api/locations?bbox=${bbox}`).then((res) => res.json()),
  })
}