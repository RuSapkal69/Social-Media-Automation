// // app/api/cron/cleanup-storage/route.ts
// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient";

// export async function GET(req: Request) {
//   // Verify cron secret for security
//   const authHeader = req.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const cleanupResults = {
//       postedFilesDeleted: 0,
//       failedFilesDeleted: 0,
//       oldDraftsDeleted: 0,
//       errors: [] as string[],
//       totalSpaceFreed: 0,
//     };

//     // 1. Clean up files from successfully posted content
//     const { data: postedPosts, error: postedError } = await supabase
//       .from("posts")
//       .select("id, media_url")
//       .eq("status", "posted")
//       .not("media_url", "is", null);

//     if (postedError) {
//       console.error("Error fetching posted posts:", postedError);
//     } else if (postedPosts && postedPosts.length > 0) {
//       for (const post of postedPosts) {
//         try {
//           const fileName = post.media_url.split('/').pop();
//           if (fileName) {
//             const { error: deleteError } = await supabase.storage
//               .from("media")
//               .remove([fileName]);

//             if (deleteError) {
//               cleanupResults.errors.push(`Failed to delete ${fileName}: ${deleteError.message}`);
//             } else {
//               cleanupResults.postedFilesDeleted++;
//               // Clear media_url from database
//               await supabase
//                 .from("posts")
//                 .update({ media_url: null })
//                 .eq("id", post.id);
//             }
//           }
//         } catch (err: any) {
//           cleanupResults.errors.push(`Error processing post ${post.id}: ${err.message}`);
//         }
//       }
//     }

//     // 2. Clean up files from failed posts older than 24 hours
//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
//     const { data: failedPosts, error: failedError } = await supabase
//       .from("posts")
//       .select("id, media_url")
//       .eq("status", "failed")
//       .not("media_url", "is", null)
//       .lt("created_at", twentyFourHoursAgo);

//     if (failedError) {
//       console.error("Error fetching failed posts:", failedError);
//     } else if (failedPosts && failedPosts.length > 0) {
//       for (const post of failedPosts) {
//         try {
//           const fileName = post.media_url.split('/').pop();
//           if (fileName) {
//             const { error: deleteError } = await supabase.storage
//               .from("media")
//               .remove([fileName]);

//             if (deleteError) {
//               cleanupResults.errors.push(`Failed to delete ${fileName}: ${deleteError.message}`);
//             } else {
//               cleanupResults.failedFilesDeleted++;
//               await supabase
//                 .from("posts")
//                 .update({ media_url: null })
//                 .eq("id", post.id);
//             }
//           }
//         } catch (err: any) {
//           cleanupResults.errors.push(`Error processing failed post ${post.id}: ${err.message}`);
//         }
//       }
//     }

//     // 3. Clean up draft files older than 7 days
//     const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
//     const { data: oldDrafts, error: draftsError } = await supabase
//       .from("posts")
//       .select("id, media_url")
//       .eq("status", "draft")
//       .not("media_url", "is", null)
//       .lt("created_at", sevenDaysAgo);

//     if (draftsError) {
//       console.error("Error fetching old drafts:", draftsError);
//     } else if (oldDrafts && oldDrafts.length > 0) {
//       for (const post of oldDrafts) {
//         try {
//           const fileName = post.media_url.split('/').pop();
//           if (fileName) {
//             const { error: deleteError } = await supabase.storage
//               .from("media")
//               .remove([fileName]);

//             if (deleteError) {
//               cleanupResults.errors.push(`Failed to delete ${fileName}: ${deleteError.message}`);
//             } else {
//               cleanupResults.oldDraftsDeleted++;
//               await supabase
//                 .from("posts")
//                 .update({ media_url: null })
//                 .eq("id", post.id);
//             }
//           }
//         } catch (err: any) {
//           cleanupResults.errors.push(`Error processing old draft ${post.id}: ${err.message}`);
//         }
//       }
//     }

//     // 4. Clean up orphaned files (files in storage but not in database)
//     const { data: allFiles, error: listError } = await supabase.storage
//       .from("media")
//       .list();

//     if (listError) {
//       console.error("Error listing storage files:", listError);
//     } else if (allFiles) {
//       // Get all media URLs from database
//       const { data: allPosts } = await supabase
//         .from("posts")
//         .select("media_url")
//         .not("media_url", "is", null);

//       const dbFileNames = new Set(
//         allPosts?.map(p => p.media_url.split('/').pop()).filter(Boolean) || []
//       );

//       const orphanedFiles = allFiles.filter(file => !dbFileNames.has(file.name));

//       for (const file of orphanedFiles) {
//         try {
//           const { error: deleteError } = await supabase.storage
//             .from("media")
//             .remove([file.name]);

//           if (deleteError) {
//             cleanupResults.errors.push(`Failed to delete orphaned file ${file.name}: ${deleteError.message}`);
//           } else {
//             console.log(`Deleted orphaned file: ${file.name}`);
//           }
//         } catch (err: any) {
//           cleanupResults.errors.push(`Error deleting orphaned file ${file.name}: ${err.message}`);
//         }
// //       }
// //     }

// //     // Get storage usage after cleanup
// //     const { data: storageUsage } = await supabase.storage
// //       .from("media")
// //       .list();

// //     const totalFiles = storageUsage?.length || 0;

// //     return NextResponse.json({
// //       message: "Storage cleanup completed",
// //       results: {
// //         ...cleanupResults,
// //         totalFilesDeleted: cleanupResults.postedFilesDeleted + 
// //                           cleanupResults.failedFilesDeleted + 
// //                           cleanupResults.oldDraftsDeleted,
// //         remainingFiles: totalFiles,
// //       },
// //     });
// //   } catch (err: any) {
// //     console.error("Cleanup cron error:", err);
// //     return NextResponse.json({ error: err.message }, { status: 500 });
// //   }
// // }

// // // Allow POST as well for manual triggers
// // export async function POST(req: Request) {
// //   return GET(req);
// // }





// // app/api/cron/post-scheduled/route.ts
// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient";
// import { postToSocialMedia } from "@/lib/platformServices";

// export async function GET(req: Request) {
//   // Verify cron secret for security
//   const authHeader = req.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const now = new Date().toISOString();

//     // Fetch posts scheduled for now or earlier
//     const { data: scheduledPosts, error: fetchError } = await supabase
//       .from("posts")
//       .select("*")
//       .eq("status", "scheduled")
//       .lte("scheduled_time", now);

//     if (fetchError) {
//       console.error("Error fetching scheduled posts:", fetchError);
//       return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
//     }

//     if (!scheduledPosts || scheduledPosts.length === 0) {
//       return NextResponse.json({ message: "No posts to publish", count: 0 });
//     }

//     const results = [];

//     for (const post of scheduledPosts) {
//       try {
//         // Fetch platform tokens
//         const { data: tokens } = await supabase
//           .from("platform_tokens")
//           .select("*")
//           .in("platform", post.platforms.map((p: string) => p.toLowerCase()));

//         if (!tokens || tokens.length === 0) {
//           console.error(`No tokens found for post ${post.id}`);
//           await supabase
//             .from("posts")
//             .update({
//               status: "failed",
//               posting_results: [{ error: "No platform tokens found" }],
//             })
//             .eq("id", post.id);
//           continue;
//         }

//         // Build token map
//         const tokenMap: any = {};
//         tokens.forEach((token) => {
//           tokenMap[token.platform] = {
//             accessToken: token.access_token,
//             userId: token.user_id,
//             ...token.additional_data,
//           };
//         });

//         // Update status to posting
//         await supabase
//           .from("posts")
//           .update({ status: "posting" })
//           .eq("id", post.id);

//         // Post to platforms
//         const postingResults = await postToSocialMedia(
//           post.platforms,
//           post.caption,
//           post.media_url,
//           post.media_type,
//           tokenMap
//         );

//         // Check if all posts failed
//         const allFailed = postingResults.every((r) => !r.success);
//         const newStatus = allFailed ? "failed" : "posted";

//         // Update post with results
//         await supabase
//           .from("posts")
//           .update({
//             status: newStatus,
//             posting_results: postingResults,
//             posted_at: new Date().toISOString(),
//           })
//           .eq("id", post.id);

//         // Cleanup: Delete media file from storage if post was successful
//         if (newStatus === "posted" && post.media_url) {
//           try {
//             // Extract file path from URL
//             const fileName = post.media_url.split('/').pop();
//             if (fileName) {
//               const { error: deleteError } = await supabase.storage
//                 .from("media")
//                 .remove([fileName]);
              
//               if (deleteError) {
//                 console.error(`Failed to delete file ${fileName}:`, deleteError);
//               } else {
//                 console.log(`Successfully deleted file ${fileName} from storage`);
//               }
//             }
//           } catch (cleanupError) {
//             console.error("Cleanup error:", cleanupError);
//             // Don't fail the entire operation if cleanup fails
//           }
//         }

//         results.push({
//           postId: post.id,
//           status: newStatus,
//           results: postingResults,
//         });
//       } catch (error: any) {
//         console.error(`Error posting ${post.id}:`, error);
        
//         await supabase
//           .from("posts")
//           .update({
//             status: "failed",
//             posting_results: [{ error: error.message }],
//           })
//           .eq("id", post.id);

//         results.push({
//           postId: post.id,
//           status: "failed",
//           error: error.message,
//         });
//       }
//     }

//     return NextResponse.json({
//       message: "Scheduled posts processed",
//       count: results.length,
//       results,
//     });
//   } catch (err: any) {
//     console.error("Cron job error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // Allow POST as well for manual triggers
// export async function POST(req: Request) {
//   return GET(req);
// }