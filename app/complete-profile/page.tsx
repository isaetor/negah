import { redirect } from "next/navigation";
import SetUsernameForm from "@/components/auth/set-username-form";
import { getUser } from "@/lib/dal";

const CompleteProfilePage = async () => {
  const user = await getUser();
  if (user?.username) return redirect(`/${user.username}`);

  return (
    <div className="flex items-center justify-center flex-col h-svh p-4">
      <SetUsernameForm />
    </div>
  );
};

export default CompleteProfilePage;
