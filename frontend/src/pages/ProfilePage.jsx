import React from "react";
import { alpha } from "@mui/material";
import {
  Avatar, Box, Card, CardContent, Chip, Divider, Typography,
} from "@mui/material";
import { COLORS, FONTS } from "../theme";

/**
 * Minimal account page used where no dedicated profile module exists (Admin).
 * Renders only real session data — never placeholder content.
 */
export default function ProfilePage({ user }) {
  const initials = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Card>
        <Box sx={{ height: 96, background: `linear-gradient(120deg, ${COLORS.INK} 0%, ${COLORS.PLUM} 100%)` }} />
        <CardContent sx={{ pt: 0, mt: -6, px: { xs: 2.5, md: 4 }, pb: 4 }}>
          <Avatar
            sx={{
              width: 88, height: 88, fontSize: 34,
              bgcolor: COLORS.GOLD, color: COLORS.INK,
              border: "5px solid #fff",
              fontFamily: FONTS.display, fontWeight: 800,
              boxShadow: "0 8px 24px -8px rgba(20,27,51,0.35)",
            }}
          >
            {initials}
          </Avatar>

          <Typography variant="h5" sx={{ mt: 2 }}>
            {user?.username || "User"}
          </Typography>
          <Chip
            size="small"
            label={user?.role || "Member"}
            sx={{ mt: 1, bgcolor: alpha(COLORS.GOLD, 0.14), color: COLORS.INK, fontWeight: 800 }}
          />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" }, rowGap: 1.5, columnGap: 2 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>Username</Typography>
            <Typography variant="body1" fontWeight={600}>{user?.username || "—"}</Typography>

            <Typography variant="body2" color="text.secondary" fontWeight={700}>Role</Typography>
            <Typography variant="body1" fontWeight={600}>{user?.role || "—"}</Typography>

            {user?.department && (
              <>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>Department</Typography>
                <Typography variant="body1" fontWeight={600}>{user.department}</Typography>
              </>
            )}
            {user?.year && (
              <>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>Year</Typography>
                <Typography variant="body1" fontWeight={600}>{user.year}</Typography>
              </>
            )}
            {user?.classSection && (
              <>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>Section</Typography>
                <Typography variant="body1" fontWeight={600}>{user.classSection}</Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
