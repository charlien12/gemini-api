def auto_format_to_table(text: str) -> str:
    """
    Converts only bullet-point list blocks with 'Feature: val1 | val2 | ...'
    into Markdown tables.
    Leaves normal text, paragraphs, and headings untouched.
    """
    lines = text.strip().split("\n")
    output_lines = []
    table_block = []
    headers = None

    def flush_table():
        nonlocal headers, table_block, output_lines
        if headers and table_block:
            # build markdown table
            table_md = "| " + " | ".join(headers) + " |\n"
            table_md += "| " + " | ".join([":---"] * len(headers)) + " |\n"
            for row in table_block:
                table_md += "| " + " | ".join(row) + " |\n"
            output_lines.append(table_md)
        # reset
        headers, table_block = None, []

    for line in lines:
        match = re.match(r"[-*]\s*\*\*(.+?)\*\*:\s*(.+)", line)
        if match:
            feature, values = match.groups()
            values_list = [v.strip() for v in values.split("|")]

            # set headers dynamically
            if not headers:
                headers = ["Feature"] + [f"Option {i+1}" for i in range(len(values_list))]

            table_block.append([feature.strip()] + values_list)
        else:
            # flush any collected table before writing normal text
            flush_table()
            output_lines.append(line)

    # flush remaining table at end
    flush_table()

    return "\n".join(output_lines)
