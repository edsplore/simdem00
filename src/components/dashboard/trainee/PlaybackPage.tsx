import React, { useState } from "react";
import { Stack, Container, CircularProgress, Box } from "@mui/material";
import Layout from "../../layout/Layout";
import DashboardContent from "../DashboardContent";
import PlaybackHeader from "./playback/PlaybackHeader";
import PlaybackStats from "./playback/PlaybackStats";
import PlaybackTable from "./playback/PlaybackTable";

const PlaybackPage = () => {
  const [globalLoading, setGlobalLoading] = useState<Boolean>(false);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 1 }}>
          <PlaybackHeader />
          <Stack spacing={5}>
            {/* {globalLoading ? (
              <>
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              </>
            ) : (
              <></>
            )} */}
            <PlaybackStats setGlobalLoading={setGlobalLoading} />
            <PlaybackTable />
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default PlaybackPage;
