export default async function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const [authCol, langCol] = [...row.children];

  // 1. Build Authentication Panel
  const authContainer = document.createElement('div');
  authContainer.className = 'header-utility-auth';

  if (authCol) {
    const greetingText = authCol.querySelector('p')?.textContent.split('\n')[0] || 'Welcome';
    const signInLink = authCol.querySelector('a[href*="sign-in"]');
    const signOutLink = authCol.querySelector('a[href*="sign-out"]');

    authContainer.innerHTML = `
      <span class="auth-greeting">${greetingText}</span>
      ${signInLink ? `<a href="${signInLink.href}" class="auth-btn auth-signin">${signInLink.textContent}</a>` : ''}
      ${signOutLink ? `<a href="${signOutLink.href}" class="auth-btn auth-signout">${signOutLink.textContent}</a>` : ''}
    `;

    // Check user login state
    try {
      const res = await fetch('/libs/granite/security/currentuser.json');
      if (res.ok) {
        const data = await res.json();
        const isAuthenticated = data && data.authorizableId && data.authorizableId !== 'anonymous';
        authContainer.classList.toggle('authenticated', isAuthenticated);
      }
    } catch {
      // Default to guest state
    }
  }

  // 2. Build Language Navigation Dropdown
  const langContainer = document.createElement('div');
  langContainer.className = 'header-utility-lang';

  if (langCol) {
    const langToggle = document.createElement('button');
    langToggle.className = 'lang-toggle-btn';
    langToggle.type = 'button';
    langToggle.setAttribute('aria-expanded', 'false');

    const dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    const currentPath = window.location.pathname;
    let currentLabel = 'en-US';

    // Parse bold tags as regions and subsequent lists as locales
    const regions = langCol.querySelectorAll('strong, b');
    regions.forEach((region) => {
      const groupWrapper = document.createElement('div');
      groupWrapper.className = 'lang-region-group';

      const regionTitle = document.createElement('span');
      regionTitle.className = 'lang-region-title';
      regionTitle.textContent = region.textContent.trim();
      groupWrapper.appendChild(regionTitle);

      const list = region.nextElementSibling?.tagName === 'UL'
        ? region.nextElementSibling
        : region.parentElement.querySelector('ul');

      if (list) {
        const clonedList = list.cloneNode(true);
        clonedList.querySelectorAll('a').forEach((a) => {
          const linkPath = new URL(a.href, window.location.origin).pathname;
          if (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)) {
            a.classList.add('is-active');
            currentLabel = a.textContent.trim();
          }
        });
        groupWrapper.appendChild(clonedList);
      }

      dropdown.appendChild(groupWrapper);
    });

    langToggle.textContent = currentLabel;

    // Toggle dropdown
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = langToggle.getAttribute('aria-expanded') === 'true';
      langToggle.setAttribute('aria-expanded', String(!open));
      dropdown.classList.toggle('is-open', !open);
    });

    // Close on outside click
    document.addEventListener('click', () => {
      langToggle.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('is-open');
    });

    langContainer.append(langToggle, dropdown);
  }

  // Replace block DOM
  block.replaceChildren(authContainer, langContainer);
}
