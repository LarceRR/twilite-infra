#!/usr/bin/env bash
set -Eeuo pipefail

: "${TEXTFILE_DIR:?set node-exporter textfile directory}"
install -d -m 755 "$TEXTFILE_DIR"
mem_total="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
mem_available="$(awk '/MemAvailable/ {print $2}' /proc/meminfo)"
swap_total="$(awk '/SwapTotal/ {print $2}' /proc/meminfo)"
swap_free="$(awk '/SwapFree/ {print $2}' /proc/meminfo)"
root_free="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print 100-$5}')"
inode_free="$(df -Pi / | awk 'NR==2 {gsub(/%/,"",$5); print 100-$5}')"
mem_ratio="$(awk -v t="$mem_total" -v a="$mem_available" 'BEGIN { if (t == 0) print 1; else printf "%.6f", (t-a)/t }')"
swap_used="$(awk -v t="$swap_total" -v f="$swap_free" 'BEGIN { if (t == 0) print 0; else print (t-f)*1024 }')"
tmp="$TEXTFILE_DIR/twilite.prom.$$"
cat > "$tmp" <<EOF
# HELP twilite_host_memory_ratio Host memory utilisation ratio.
# TYPE twilite_host_memory_ratio gauge
twilite_host_memory_ratio $mem_ratio
# HELP twilite_host_swap_bytes Host swap bytes used.
# TYPE twilite_host_swap_bytes gauge
twilite_host_swap_bytes $swap_used
# HELP twilite_host_disk_free_ratio Host filesystem free ratio.
# TYPE twilite_host_disk_free_ratio gauge
twilite_host_disk_free_ratio $(awk -v x="$root_free" 'BEGIN {printf "%.6f", x/100}')
# HELP twilite_host_inode_free_ratio Host inode free ratio.
# TYPE twilite_host_inode_free_ratio gauge
twilite_host_inode_free_ratio $(awk -v x="$inode_free" 'BEGIN {printf "%.6f", x/100}')
EOF
mv "$tmp" "$TEXTFILE_DIR/twilite.prom"
