import urllib2
import json

if __name__ == "__main__":
    response = urllib2.urlopen('http://reports.ooni.nu:3000/reports?select=%22-_id%20probe_cc%20test_name%20start_time%22&limit=0&sort=start_time')
    json_string = response.read()
    reports = json.loads(json_string)
    with open('country_codes.json') as f:
        country_codes = json.load(f)
    sanitised_reports = []
    for report in reports:
        if report['probe_cc'] != u'ZZ':
            report['probe_cc'] = country_codes[report['probe_cc']]
            sanitised_reports.append(report)
    with open('reports.json', 'w') as f:
        f.write('var reports = ')
        json.dump(sanitised_reports, f)
