import os
import csv
f = open("tax_parcels.csv", 'r')
o = open("tax+parcels.csv", 'w')

n = 10

reader =csv.reader(f)
writer = csv.writer(o)

i = 0
while i < n:
    row = reader.next()
    i += 1
    writer.writerow(row)
