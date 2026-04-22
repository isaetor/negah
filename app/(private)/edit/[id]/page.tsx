import CreateMediaForm from "@/components/app/create-media-form";

const EditPostPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <CreateMediaForm id={id} />;
};

export default EditPostPage;
