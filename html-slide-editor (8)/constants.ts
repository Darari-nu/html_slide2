
export const DEFAULT_SLIDE_CONTENT = `
<div class="w-full h-full flex flex-col justify-center items-center text-center p-10 sm:p-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-white)] relative overflow-hidden">
  
  <!-- Decorative shapes -->
  <div class="absolute -top-16 -left-16 w-48 h-48 bg-[var(--color-accent-1)] rounded-full opacity-30 animate-pulse delay-500"></div>
  <div class="absolute -bottom-20 -right-10 w-60 h-60 bg-[var(--color-accent-3)] rounded-xl opacity-40 transform rotate-12 animate-pulse delay-1000"></div>

  <div class="relative z-10 bg-[rgba(255,255,255,0.1)] backdrop-blur-md p-8 sm:p-12 rounded-xl shadow-2xl">
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style="text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      New Slide Title
    </h1>
    <p class="text-xl sm:text-2xl mb-8 opacity-90">
      Start building your amazing presentation.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left text-[var(--color-text-primary)]">
      <div class="bg-[var(--color-white)] p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 class="text-lg sm:text-xl font-semibold text-[var(--color-primary)] mb-2">Feature 1</h2>
        <p class="text-sm sm:text-base text-[var(--color-text-secondary)]">Use Tailwind CSS for rapid UI development.</p>
      </div>
      <div class="bg-[var(--color-white)] p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 class="text-lg sm:text-xl font-semibold text-[var(--color-secondary)] mb-2">Feature 2</h2>
        <p class="text-sm sm:text-base text-[var(--color-text-secondary)]">Click preview elements to highlight code.</p>
      </div>
      <div class="bg-[var(--color-white)] p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 class="text-lg sm:text-xl font-semibold text-[var(--color-accent-2)] mb-2">Feature 3</h2>
        <p class="text-sm sm:text-base text-[var(--color-text-secondary)]">Create engaging and informative slides.</p>
      </div>
    </div>
  </div>

  <p class="mt-12 text-sm opacity-70 absolute bottom-6">
    Edit this content or add your own!
  </p>
</div>

<style>
  /* Define CSS variables within the slide content for isolated use or if global styles are not available in iframe */
  :root {
    --color-primary: #4A90E2;
    --color-secondary: #50E3C2;
    --color-accent-1: #FFD166;
    --color-accent-3: #9D59EC;
    --color-accent-2: #F25F5C;
    --color-white: #FFFFFF;
    --color-text-primary: #333333;
    --color-text-secondary: #757575;
  }
  /* Animation for decorative shapes */
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.05); }
  }
  .animate-pulse { /* Tailwind's pulse might conflict or be different, so ensure this one is specific */
    animation: pulse 3s infinite ease-in-out;
  }
</style>
`;