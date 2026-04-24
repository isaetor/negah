import CreateMediaForm from "@/components/app/post/create-media-form";

const CreatePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) => {
  const { new: createKey } = await searchParams;

  return <CreateMediaForm key={createKey ?? "create"} />;
};

export default CreatePage;
