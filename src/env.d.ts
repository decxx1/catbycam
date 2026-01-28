/// <reference path="../.astro/types.d.ts" />

import type { User } from '@/services/userService';

declare namespace App {
  interface Locals {
    user?: User;
  }
}
