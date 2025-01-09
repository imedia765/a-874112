import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TestResult {
  metric_name?: string;
  check_type?: string;
  current_value?: number;
  threshold?: number;
  status: string;
  details: any;
}

interface TestResultsTableProps {
  results: TestResult[];
  type: 'system' | 'performance' | 'security' | 'configuration';
}

const TestResultsTable = ({ results, type }: TestResultsTableProps) => {
  if (!results?.length) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
        return 'bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20';
      case 'warning':
        return 'bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20';
      case 'critical':
        return 'bg-dashboard-error/10 text-dashboard-error border-dashboard-error/20';
      default:
        return 'bg-dashboard-info/10 text-dashboard-info border-dashboard-info/20';
    }
  };

  const groupedResults = results.reduce((acc: { [key: string]: TestResult[] }, result) => {
    const group = result.metric_name || result.check_type || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(result);
    return acc;
  }, {});

  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {Object.entries(groupedResults).map(([group, groupResults], groupIndex) => (
        <AccordionItem key={groupIndex} value={`item-${groupIndex}`} className="border rounded-lg border-dashboard-cardBorder">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-dashboard-text">{group}</span>
              <Badge variant={groupResults[0].status.toLowerCase() === 'critical' ? 'destructive' : 'outline'} 
                     className={getStatusColor(groupResults[0].status)}>
                {groupResults[0].status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <Table>
              <TableHeader className="bg-dashboard-card/50">
                <TableRow className="border-b border-dashboard-cardBorder">
                  <TableHead className="text-dashboard-text">Name</TableHead>
                  {type === 'performance' && (
                    <>
                      <TableHead className="text-dashboard-text">Current Value</TableHead>
                      <TableHead className="text-dashboard-text">Threshold</TableHead>
                    </>
                  )}
                  <TableHead className="text-dashboard-text">Status</TableHead>
                  <TableHead className="text-dashboard-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupResults.map((result, index) => (
                  <TableRow key={index} className="border-b border-dashboard-cardBorder/50">
                    <TableCell className="font-medium text-dashboard-text">
                      {result.metric_name || result.check_type}
                    </TableCell>
                    {type === 'performance' && (
                      <>
                        <TableCell className="text-dashboard-muted">
                          {result.current_value?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-dashboard-muted">
                          {result.threshold}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge 
                        variant={result.status.toLowerCase() === 'critical' ? 'destructive' : 'outline'}
                        className={getStatusColor(result.status)}
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-dashboard-cardBorder">
                            <Info className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-dashboard-card border-dashboard-cardBorder">
                          <DialogHeader>
                            <DialogTitle className="text-dashboard-text">
                              {result.metric_name || result.check_type}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 text-dashboard-text">Details:</h4>
                            <pre className="bg-dashboard-dark/50 p-4 rounded-lg overflow-auto max-h-[400px] text-sm text-dashboard-text">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default TestResultsTable;