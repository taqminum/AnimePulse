import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    vercelEnv: process.env.VERCEL_ENV || null,
    vercelUrl: process.env.VERCEL_URL || null,
    vercelDeploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    vercelGitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    vercelGitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
    vercelGitProvider: process.env.VERCEL_GIT_PROVIDER || null,
  });
}

