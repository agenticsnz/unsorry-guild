import { redirect } from 'next/navigation'

// unsorry-guild is domain-scoped; the root sends visitors to the only domain.
export default function RootPage() {
  redirect('/math')
}
