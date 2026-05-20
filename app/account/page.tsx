import { redirect } from "next/navigation";

/**
 * /account is a legacy stub — redirect to the real profile hub at /my.
 */
export default function AccountPage() {
  redirect("/my");
}
