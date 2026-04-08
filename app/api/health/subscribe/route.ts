import { NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

type HealthCheckResponse = {
  status: 'ok' | 'degraded';
  message?: string;
  checks: {
    beehiiv_env: {
      configured: boolean;
      message: string;
    };
    upstash_env: {
      configured: boolean;
      message: string;
    };
    upstash_connectivity: {
      ok: boolean;
      message: string;
    };
  };
};

function jsonResponse(body: Record<string, unknown>, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store');

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

function checkBeehiivEnv(): { configured: boolean; message: string } {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim();
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID?.trim();
  const configured = Boolean(apiKey && publicationId);

  return {
    configured,
    message: configured
      ? 'Beehiiv environment variables present'
      : 'Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID',
  };
}

function checkUpstashEnv(): { configured: boolean; message: string } {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const configured = Boolean(redisUrl && redisToken);

  return {
    configured,
    message: configured
      ? 'Upstash environment variables present'
      : 'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN',
  };
}

function isAuthTokenValid(request: Request): boolean {
  const healthCheckToken = process.env.HEALTH_CHECK_TOKEN?.trim();
  const requiresAuth =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_TARGET_ENV === 'production' ||
    Boolean(healthCheckToken);

  if (!requiresAuth) {
    return true;
  }

  if (!healthCheckToken) {
    return false;
  }

  const submittedToken = request.headers.get('x-health-token');

  return submittedToken === healthCheckToken;
}

async function checkUpstashConnectivity(): Promise<{ ok: boolean; message: string }> {
  try {
    await ratelimit.limit('healthcheck');
    return {
      ok: true,
      message: 'Upstash connectivity verified',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      message: `Upstash connectivity check failed: ${errorMessage}`,
    };
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthTokenValid(request)) {
    return jsonResponse(
      {
        status: 'degraded',
        message: 'Authentication required.',
      },
      { status: 401 },
    );
  }

  const beehiivEnvCheck = checkBeehiivEnv();
  const upstashEnvCheck = checkUpstashEnv();
  const upstashConnectivityCheck = await checkUpstashConnectivity();

  const allChecksPassed = beehiivEnvCheck.configured && upstashEnvCheck.configured && upstashConnectivityCheck.ok;
  const status = allChecksPassed ? 'ok' : 'degraded';
  const httpStatus = allChecksPassed ? 200 : 503;

  const response: HealthCheckResponse = {
    status,
    checks: {
      beehiiv_env: beehiivEnvCheck,
      upstash_env: upstashEnvCheck,
      upstash_connectivity: upstashConnectivityCheck,
    },
  };

  return jsonResponse(response, { status: httpStatus });
}
