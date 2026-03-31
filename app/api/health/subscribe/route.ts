import { NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

type HealthCheckResponse = {
  status: 'ok' | 'degraded';
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

  // Skip auth check if HEALTH_CHECK_TOKEN is not set
  if (!healthCheckToken) {
    return true;
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
  // Check authentication token if configured
  if (!isAuthTokenValid(request)) {
    return NextResponse.json(
      {
        status: 'degraded',
        checks: {
          beehiiv_env: {
            configured: false,
            message: 'Authentication failed',
          },
          upstash_env: {
            configured: false,
            message: 'Authentication failed',
          },
          upstash_connectivity: {
            ok: false,
            message: 'Authentication failed',
          },
        },
      },
      { status: 401 },
    );
  }

  // Perform environment variable checks
  const beehiivEnvCheck = checkBeehiivEnv();
  const upstashEnvCheck = checkUpstashEnv();
  const upstashConnectivityCheck = await checkUpstashConnectivity();

  // Determine overall status
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

  return NextResponse.json(response, { status: httpStatus });
}
