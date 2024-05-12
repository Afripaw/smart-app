import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";

const usePageAccess = (accessRoles: ("System Administrator" | "Data Analyst" | "Data Consumer" | "Treatment Data Capturer" | "General Data Capturer")[]) => {
  const router = useRouter();

  const { data: user } = api.user.getOwnUser.useQuery();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user || !router.isReady) return;

    // Messages Page
    if (!accessRoles.includes(user?.role as "System Administrator" | "Data Analyst" | "Data Consumer" | "Treatment Data Capturer" | "General Data Capturer")) {
      setHasAccess(false);
      void router.push("/dashboard");
      return;
    }

    setHasAccess(true);
  }, [router, user, accessRoles]);

  return hasAccess;
};

export default usePageAccess;
