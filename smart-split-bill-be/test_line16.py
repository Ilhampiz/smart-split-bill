import re

line15 = "GLAD2GLOW MILy AMINO ACIDS BRIGHT CLEANS"
line16 = "1308277 1 PCS x 37,500 37,500"

split_parts = re.split(r'\s+[xX*@]\s+', line16, maxsplit=1)
print("split_parts:", split_parts)
left_part, right_part = split_parts[0], split_parts[1]
qty_candidates = re.findall(r'\b\d{1,3}\b', left_part)
print("qty_candidates:", qty_candidates)
price_candidates = re.findall(r'\d{1,3}(?:[.,]\d{3})+|\d{4,9}', right_part)
print("price_candidates:", price_candidates)

