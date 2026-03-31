#!/usr/bin/env python3
"""Update the AI Threat Brief completion guide HTML to reflect current task status.
Run: python3 scripts/update-completion-guide.py ~/Downloads/ai-threat-brief-completion-guide.html
"""
import os
import re
import sys
from html import escape as html_escape
from pathlib import Path
from urllib.parse import urlparse

DEFAULT_PATH = Path.home() / 'Downloads' / 'ai-threat-brief-completion-guide.html'


def load_publication_evidence() -> dict[str, str]:
    publication_url = os.environ.get('BEEHIIV_PUBLICATION_URL')
    published_at = os.environ.get('BEEHIIV_PUBLISHED_AT')
    post_title = os.environ.get('BEEHIIV_POST_TITLE')

    publication_url = publication_url.strip() if publication_url is not None else None
    published_at = published_at.strip() if published_at is not None else None
    post_title = post_title.strip() if post_title is not None else None

    if not publication_url and not published_at and not post_title:
        return {}

    if not publication_url or not published_at or not post_title:
        raise SystemExit(
            'Partial Beehiiv publication evidence supplied. Set BEEHIIV_PUBLICATION_URL, '
            'BEEHIIV_PUBLISHED_AT, and BEEHIIV_POST_TITLE together with non-empty values.'
        )

    validate_publication_url(publication_url)

    return {
        'publication_url': publication_url,
        'published_at': published_at,
        'post_title': post_title,
    }


def validate_publication_url(publication_url: str) -> None:
    parsed_url = urlparse(publication_url)
    normalized_path = parsed_url.path.rstrip('/')

    if parsed_url.scheme != 'https' or parsed_url.netloc != 'app.beehiiv.com' or parsed_url.query or parsed_url.fragment:
        raise SystemExit(
            'Invalid Beehiiv publication URL. Use an https://app.beehiiv.com/posts/<post-id> '
            'link without query parameters or fragments.'
        )

    if not re.fullmatch(r'/posts/[A-Za-z0-9-]+', normalized_path):
        raise SystemExit(
            'Invalid Beehiiv publication URL path. Use an https://app.beehiiv.com/posts/<post-id> '
            'link.'
        )


def ensure_pristine_guide(html: str) -> None:
    updated_markers = [
        r'✓ COMPLETE',
        r'Task 1 done: newsletter published',
        r'updated after Task 1 completion',
        r'Publication evidence applied successfully\.',
    ]
    required_pristine_markers = {
        'task badge': r'ACTION REQUIRED\s*</span>\s*Task 1: Send First Newsletter via Beehiiv',
        'task title': r'Publish Issue #5 from draft',
        'task priority': r'~5 min\s*\xb7\s*HIGH PRIORITY',
        'task description': r'Your newsletter infrastructure is fully wired.*?subscriber list\.',
        'roadmap note': r'Complete the 5 manual tasks above\.',
        'analysis timestamp': r'Analysis generated \d+ \w+ \d+',
    }

    if any(re.search(marker, html) for marker in updated_markers):
        raise SystemExit(
            'The completion guide already appears to include Task 1 updates. Reset or '
            're-export the pristine guide before rerunning this script.'
        )

    missing_markers = [
        label for label, pattern in required_pristine_markers.items() if not re.search(pattern, html, flags=re.DOTALL)
    ]

    if missing_markers:
        raise SystemExit(
            'The completion guide did not match the expected pristine Task 1 structure. Missing: '
            + ', '.join(missing_markers)
            + '. Re-export a fresh guide before retrying.'
        )


def update_guide(path: Path) -> None:
    html = path.read_text(encoding='utf-8')
    original = html
    evidence = load_publication_evidence()

    if not evidence:
        print('No Beehiiv publication evidence supplied; leaving the completion guide unchanged.')
        return

    ensure_pristine_guide(html)

    publication_url = html_escape(evidence['publication_url'], quote=True)
    published_at = html_escape(evidence['published_at'])
    post_title = html_escape(evidence['post_title'])

    # 1. Stats card: 5 tasks -> 4 tasks
    html = re.sub(r'(>)5 tasks(<)', r'\g<1>4 tasks\g<2>', html)

    # 2. Stats card: ~35 min -> ~30 min
    html = html.replace('~35 min total', '~30 min total')

    # 3. Task 1 section badge: ACTION REQUIRED -> COMPLETE (green)
    # Match the badge span immediately before 'Task 1' heading
    html = re.sub(
        r'(<span[^>]*>\s*ACTION REQUIRED\s*</span>)(\s*)(Task 1: Send First Newsletter via Beehiiv)',
        '<span style="background:#166534;color:#dcfce7;font-size:10px;font-weight:700;letter-spacing:.12em;padding:3px 10px;border-radius:4px;text-transform:uppercase;">✓ COMPLETE</span>\\2\\3',
        html,
    )

    # 4. Task 1 card title
    html = html.replace('Publish Issue #5 from draft', post_title)

    # 5. Task 1 time/priority badge
    html = re.sub(
        r'~5 min\s*\xb7\s*HIGH PRIORITY',
        f'DONE \u00b7 {published_at}',
        html,
    )

    # 6. Task 1 description text
    html = re.sub(
        r'Your newsletter infrastructure is fully wired.*?subscriber list\.',
        f'Newsletter published {published_at}. '
        f'Post: \u201c{post_title}\u201d '
        'Sent to all free subscribers via Email and Web. '
        f'<a href="{publication_url}" '
        'style="color:inherit;">View post on Beehiiv \u2192</a>',
        html,
        flags=re.DOTALL,
    )

    # 7. "YOU ARE HERE" roadmap note
    html = html.replace(
        'Complete the 5 manual tasks above.',
        f'Complete the 4 remaining manual tasks. \u2705 Task 1 done: newsletter published {published_at}.',
    )

    # 8. Update analysis timestamp without hardcoding a stale date.
    html = re.sub(
        r'Analysis generated \d+ \w+ \d+',
        f'Analysis generated {published_at} (updated after Task 1 completion: {post_title})',
        html,
    )

    if html == original:
        raise SystemExit(
            'No completion-guide changes were applied even though the pristine Task 1 markers '
            'were present. Re-export a fresh guide before retrying.'
        )

    path.write_text(html, encoding='utf-8')
    print(f'Updated {path}')
    print('Publication evidence applied successfully.')


if __name__ == '__main__':
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not target.exists():
        print(f'ERROR: File not found: {target}')
        sys.exit(1)
    update_guide(target)
