import { getStaticRetrofitCms } from './staticContent'

export type { RetrofitCmsPayload } from '../types/retrofitCms'

export async function fetchRetrofitCms() {
  return getStaticRetrofitCms()
}
