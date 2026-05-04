<script lang="ts">
  export let icon: string = "fa-solid fa-star";
  export let label: string = "";
  export let onClick: () => void = () => {};
</script>

<div class="sd-tool-item">
  <button type="button" class="sd-tool-btn" on:click={onClick}>
    <i class="{icon}"></i>
    {label}
  </button>
</div>

<style>
  .sd-tool-item {
    padding: 4px 8px;
  }

  .sd-tool-btn {
    width: 100% !important;
    height: 36px !important;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.9em;
    font-weight: 600;
    color: inherit;
    transition: background 120ms;
  }

  .sd-tool-btn:hover {
    background: rgba(255,255,255,0.12);
  }
</style>