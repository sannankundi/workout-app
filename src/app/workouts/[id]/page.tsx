import WorkoutPage from "./WorkoutPage";

// Option 1: Align with Promise type to match generated PageProps
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Unwrap the Promise
  return <WorkoutPage id={id} />;
}

// Option 2: Use type suppression to bypass TypeScript error (uncomment to use)
// // @ts-ignore
// export default function Page({ params }: { params: { id: string } }) {
//   return <WorkoutPage id={params.id} />;
// }

// Force static rendering for Firebase Spark plan
export const dynamic = "force-static";