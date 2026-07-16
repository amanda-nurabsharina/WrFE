import { useQuery } from "@tanstack/react-query";
import { imsService } from "../api/ims.service";
import { useStore } from "../store/store";

export const usePermission = () => {
  const user = useStore((state) => state.user);
  
  const { data: rolesResp } = useQuery({
    queryKey: ["roles"],
    queryFn: () => imsService.getRoles(),
    enabled: !!user,
  });

  const roles = rolesResp?.data?.data || [];
  const roleName = user?.rawRole || (user?.role as unknown as string) || "";
  const userRoleObj = roles.find((r: any) => r.name === roleName);
  const userPermissions = userRoleObj?.permissions || {};

  const hasPermission = (menuKey: string, action: string) => {
    // super_admin always has all permissions
    if (roleName === "super_admin") return true;

    const actions = userPermissions[menuKey] || [];
    return actions.includes(action);
  };

  return { hasPermission, roleName, permissions: userPermissions };
};
