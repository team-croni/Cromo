import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore } from "@store/sidebarStore";
import { DEFAULT_AVATAR_GRADIENT } from "@constants/avatar-gradients";

export function useUser() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      return {
        ...data,
        avatarColor: data.avatarColor || DEFAULT_AVATAR_GRADIENT,
        avatarType: data.avatarType || "gradient",
      };
    },
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = userData || (status === "authenticated" && session?.user ? {
    ...session.user,
    avatarColor: session.user.avatarColor || DEFAULT_AVATAR_GRADIENT,
    avatarType: session.user.avatarType || "gradient",
  } : null);

  const mutation = useMutation({
    mutationFn: async (updates: { avatarColor?: string; avatarType?: "gradient" | "solid" | "image" }) => {
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update Query Cache
      queryClient.setQueryData(['user', 'profile'], (oldData: any) => ({
        ...oldData,
        ...updatedUser
      }));

      // Update Sidebar Store (sync with UI)
      useSidebarStore.getState().setAvatarInfo(updatedUser.avatarColor, updatedUser.avatarType);

      // Emit Socket Event
      if (typeof window !== 'undefined' && (window as any).socket) {
        (window as any).socket.emit('user-avatar-updated', updatedUser);
      }
    },
  });

  return {
    user,
    updateUser: mutation.mutateAsync,
    status
  };
}