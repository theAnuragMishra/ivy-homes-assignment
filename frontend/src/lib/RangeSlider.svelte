<script lang="ts">
	type Props = {
		label: string;
		min: number;
		max: number;
		step: number;
		lower: number;
		upper: number;
		format?: (value: number) => string;
		onChange?: () => void;
	};

	let {
		label,
		min,
		max,
		step,
		lower = $bindable(),
		upper = $bindable(),
		format = (value: number) => value.toLocaleString('en-IN'),
		onChange = () => {}
	}: Props = $props();

	function updateLower(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		lower = Math.min(value, upper - step);
		onChange();
	}

	function updateUpper(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		upper = Math.max(value, lower + step);
		onChange();
	}
</script>

<div class="grid gap-2">
	<div class="flex items-center justify-between gap-3 text-xs font-bold text-[#526058]">
		<span>{label}</span>
		<span class="text-right text-[#1e5b3a]">
			{format(lower)} – {format(upper)}
		</span>
	</div>
	<div class="relative h-7">
		<div class="absolute top-3 right-0 left-0 h-1 rounded-full bg-[#d8e3da]"></div>
		<div
			class="absolute top-3 h-1 rounded-full bg-[#1e5b3a]"
			style:left={`${((lower - min) / (max - min)) * 100}%`}
			style:right={`${100 - ((upper - min) / (max - min)) * 100}%`}
		></div>
		<input
			class="pointer-events-none absolute top-0 left-0 z-20 m-0 h-7 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#1e5b3a] [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#1e5b3a]"
			type="range"
			{min}
			{max}
			{step}
			value={lower}
			aria-label={`${label} minimum`}
			oninput={updateLower}
		/>
		<input
			class="pointer-events-none absolute top-0 left-0 z-10 m-0 h-7 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#1e5b3a] [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#1e5b3a]"
			type="range"
			{min}
			{max}
			{step}
			value={upper}
			aria-label={`${label} maximum`}
			oninput={updateUpper}
		/>
	</div>
</div>
