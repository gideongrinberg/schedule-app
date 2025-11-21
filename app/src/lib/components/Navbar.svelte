<script lang="ts">
  import * as NavigationMenu from "$lib/components/ui/navigation-menu";
</script>
<nav class="w-full bg-white shadow-sm">
  <div class="flex items-center justify-between px-4 py-3">
    <div class="text-xl font-bold">
      BearSched
    </div>

    <NavigationMenu.Root>
      <NavigationMenu.List class="flex">
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/" class="text-md font-semibold hover:text-blue-600">
            Catalog
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/scheduler" class="text-md font-semibold hover:text-blue-600">
            Scheduler
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/about" class="text-md font-semibold hover:text-blue-600">
            About
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  </div>
</nav>
