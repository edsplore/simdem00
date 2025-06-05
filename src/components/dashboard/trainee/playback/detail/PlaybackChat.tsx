import React from "react";
import { Stack, Paper, Typography, Box, Avatar, Chip } from "@mui/material";

interface KeywordMatch {
  word: string;
  matched: boolean;
}

interface KeywordAnalysisDetail {
  total_keywords: number;
  missing_keywords: number;
  missing_keywords_list: string[];
  total_points: number;
  missing_points: number;
  keyword_matches: KeywordMatch[];
}

interface KeywordAnalysisItem {
  role: "assistant" | "customer";
  script_sentence: string;
  actual_sentence: string;
  keyword_analysis?: Partial<KeywordAnalysisDetail>;
}

interface PlaybackChatProps {
  keywordAnalysis: KeywordAnalysisItem[];
}

function highlightSentence(
  sentence: string,
  keyword_matches: KeywordMatch[] = [],
  mode: 'actual' | 'script'
) {
  let elements: (string | JSX.Element)[] = [sentence];
  keyword_matches.forEach((match) => {
    const newElements: (string | JSX.Element)[] = [];
    elements.forEach((el) => {
      if (typeof el === "string") {
        const parts = el.split(new RegExp(`(${match.word})`, "gi"));
        parts.forEach((part, idx) => {
          if (part.toLowerCase() === match.word.toLowerCase()) {
            if (match.matched) {
              newElements.push(
                <span
                  key={match.word + idx + mode}
                  style={{
                    color: "#219653",
                    fontWeight: 700,
                    background: "rgba(76, 175, 80, 0.08)",
                    borderRadius: 4,
                    padding: "0 2px",
                  }}
                >
                  {part}
                </span>
              );
            } else if (mode === 'script') {
              newElements.push(
                <span
                  key={match.word + idx + mode}
                  style={{
                    color: "#D32F2F",
                    fontWeight: 700,
                    background: "rgba(211, 47, 47, 0.08)",
                    borderRadius: 4,
                    padding: "0 2px",
                  }}
                >
                  {part}
                </span>
              );
            } else {
              newElements.push(part);
            }
          } else if (part) {
            newElements.push(part);
          }
        });
      } else {
        newElements.push(el);
      }
    });
    elements = newElements;
  });
  return elements;
}

const PlaybackChat = ({ keywordAnalysis }: PlaybackChatProps) => {

  return (
    <Box
      sx={{
        padding: 2,
        paddingBottom: 4,
      }}
    >
      <Stack spacing={2}>
        {keywordAnalysis.filter(item => item.actual_sentence && item.actual_sentence.trim() !== '').map((item, index) => {
          const isAgent = item.role === "assistant";
          const keywordData = item.keyword_analysis || {};
          return (
            <Stack
              key={index}
              direction="row"
              spacing={1}
              justifyContent={isAgent ? "flex-end" : "flex-start"}
            >
              {!isAgent && <Avatar sx={{ width: 32, height: 32 }}>C</Avatar>}
              <Box sx={{ maxWidth: "80%" }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isAgent ? "12px" : 2,
                    bgcolor: isAgent ? "#FAFBFF" : "#FAFAFF",
                    border: isAgent ? "1px solid #0F174F99" : "2px solid #6D7295",
                    borderRadius: isAgent ? "16px 2px 16px 16px" : "0px 16px 16px 16px",
                    color: isAgent ? "#fff" : "primary.dark",
                    boxShadow: isAgent ? "0px 12px 24px -4px #343F8A1F" : "none",
                    width: isAgent ? 492 : undefined,
                    maxWidth: isAgent ? 600 : undefined,
                    gap: isAgent ? "12px" : undefined,
                  }}
                >
                  {isAgent ? (
                    <>
                      {/* Script (expected) sentence always on top */}
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          color: "#23254C",
                          fontWeight: 400,
                          mb: 1,
                          fontSize: "16px",
                        }}
                      >
                        {highlightSentence(
                          item.script_sentence,
                          keywordData.keyword_matches || [],
                          'script'
                        )}
                      </Typography>
                      {/* Divider between messages */}
                      <Box sx={{ borderBottom: "1px solid #E5E7EB", mb: 1 }} />
                      {/* Actual sentence always below */}
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          color: "#23254C",
                          fontWeight: 700,
                          mb: 0,
                          fontSize: "16px",
                        }}
                      >
                        {highlightSentence(
                          item.actual_sentence,
                          keywordData.keyword_matches || [],
                          'actual'
                        )}
                      </Typography>
                      {/* Divider above the scores */}
                      <Box sx={{ borderBottom: "1px solid #E5E7EB", mb: 1 }} />
                      {/* Scores Row (only if keyword_analysis and total_points > 0) */}
                      {typeof keywordData.total_points === 'number' && keywordData.total_points > 0 && (
                        <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                          <Chip
                            label={<><span style={{ fontWeight: 700 }}>{keywordData.total_keywords && keywordData.missing_keywords !== undefined ? `${keywordData.total_keywords - keywordData.missing_keywords}/${keywordData.total_keywords}` : "0/0"}</span> Keyword Score</>}
                            size="small"
                            sx={{
                              minWidth: 120,
                              maxWidth: "none",
                              height: 36,
                              gap: "8px",
                              padding: 0,
                              borderRadius: "100px",
                              border: "1px solid #0F174F66",
                              bgcolor: "#fff",
                              color: "#1C2358",
                              fontSize: "14px",
                              lineHeight: "20px",
                              letterSpacing: 0,
                              fontWeight: 500,
                              transition: "none",
                              whiteSpace: "nowrap",
                              overflow: "visible",
                              textOverflow: "unset",
                              '&:hover': {
                                bgcolor: '#E6EAF5',
                                cursor: 'pointer',
                              },
                            }}
                          />
                        </Stack>
                      )}
                    </>
                  ) : (
                    // CUSTOMER: Only show actual_sentence
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        color: "#23254C",
                        fontWeight: 400,
                        mb: 0,
                        fontSize: "16px",
                      }}
                    >
                      {item.script_sentence}
                    </Typography>
                  )}
                </Paper>
              </Box>
              {isAgent && (
                <Avatar
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
                  sx={{ width: 40, height: 40, alignSelf: "center" }}
                />
              )}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
};

export default PlaybackChat;